import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  primitiveCssVariableNames,
  semanticCssVariableNames,
} from "@combric/tokens";

export type GuardSeverity = "pass" | "warning" | "error";

export interface GuardDiagnostic {
  ruleId: string;
  severity: GuardSeverity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface GuardSummary {
  errors: number;
  warnings: number;
  checkedFiles: number;
  checkedContracts: number;
}

export interface GuardResult {
  schemaVersion: 1;
  projectRoot: ".";
  summary: GuardSummary;
  diagnostics: GuardDiagnostic[];
}

export class GuardOperationalError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GuardOperationalError";
    this.code = code;
  }
}

type Mode = "css" | "react" | "tailwind" | "react-tailwind";
interface GuardConfig {
  schemaVersion: 1;
  packageManager: string;
  mode: Mode;
  cssFile: string;
}
interface CssFile {
  file: string;
  text: string;
  imports: string[];
}

const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_CONFIG_BYTES = 64 * 1024;
const MAX_CSS_BYTES = 1024 * 1024;
const MAX_ENTRIES = 2000;
const MAX_DEPTH = 8;
const IGNORED = new Set([
  ".git",
  ".next",
  ".output",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  ".astro",
  ".cache",
]);
const PUBLIC_CSS = new Set([
  "@combric/tokens/css",
  "@combric/react/css",
  "@combric/layout/css",
  "@combric/tailwind",
]);
const VALID_VARIABLES = new Set([
  ...Object.values(primitiveCssVariableNames),
  ...Object.values(semanticCssVariableNames),
]);

function inside(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    path === "" ||
    (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path))
  );
}

function safeRelativePath(root: string, requested: string): string {
  if (!requested || isAbsolute(requested) || /^[A-Za-z]:/.test(requested)) {
    throw new GuardOperationalError(
      "UNSAFE_PATH",
      "Configured cssFile must be project-relative.",
    );
  }
  const target = resolve(root, requested);
  if (!inside(root, target) || target === root || !target.endsWith(".css")) {
    throw new GuardOperationalError(
      "UNSAFE_PATH",
      "Configured CSS file must be a .css file inside the project.",
    );
  }
  return target;
}

async function boundedRead(
  root: string,
  target: string,
  limit: number,
  label: string,
): Promise<string> {
  if (!inside(root, target)) {
    throw new GuardOperationalError(
      "UNSAFE_PATH",
      `${label} is outside the project.`,
    );
  }
  let fileStat;
  try {
    fileStat = await lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new GuardOperationalError("MISSING_FILE", `${label} is missing.`);
    }
    throw error;
  }
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
    throw new GuardOperationalError(
      "UNSAFE_FILE",
      `${label} must be a regular file, not a symlink.`,
    );
  }
  if (fileStat.size > limit) {
    throw new GuardOperationalError(
      "FILE_TOO_LARGE",
      `${label} exceeds the supported size limit.`,
    );
  }
  const canonical = await realpath(target);
  if (!inside(root, canonical)) {
    throw new GuardOperationalError(
      "UNSAFE_PATH",
      `${label} resolves outside the project.`,
    );
  }
  const contents = await readFile(target, "utf8");
  if (Buffer.byteLength(contents, "utf8") > limit) {
    throw new GuardOperationalError(
      "FILE_TOO_LARGE",
      `${label} exceeds the supported size limit.`,
    );
  }
  return contents;
}

function parseDependencies(
  value: Record<string, unknown>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ]) {
    const entries = value[field];
    if (!entries || typeof entries !== "object" || Array.isArray(entries))
      continue;
    for (const [name, version] of Object.entries(entries)) {
      if (typeof version === "string") result[name] = version;
    }
  }
  return result;
}

function cssImports(text: string): string[] {
  const clean = maskComments(text);
  return [...clean.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)].map(
    (match) => match[1]!,
  );
}

function maskComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\r\n]/g, " "),
  );
}

function maskStrings(text: string): string {
  return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (quoted) =>
    quoted.replace(/[^\r\n]/g, " "),
  );
}

function location(
  text: string,
  offset: number,
): { line: number; column: number } {
  const before = text.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - before.lastIndexOf("\n");
  return { line, column };
}

function compatibleReact(version: string): boolean {
  return (
    /^(?:\^|~)?19(?:\.\d+){0,2}$/.test(version.trim()) ||
    /^>=\s*19(?:\.\d+){0,2}\s+<\s*20(?:\.0){0,2}$/.test(version.trim())
  );
}

function compatibleTailwind(version: string): boolean {
  const match =
    version.trim().match(/^(?:\^|~)?4\.(\d+)(?:\.\d+)?$/) ??
    version.trim().match(/^>=\s*4\.(\d+)(?:\.\d+)?\s+<\s*5(?:\.0){0,2}$/);
  return Boolean(match && Number(match[1]) >= 3);
}

function declaredVersionStatus(
  version: string,
  compatible: (value: string) => boolean,
): "supported" | "unsupported" | "unknown" {
  if (compatible(version)) return "supported";
  // Only a clearly stated major/minor can establish incompatibility.
  // Workspace, file, alias, and nonstandard ranges require a human review.
  return /^(?:\^|~)?\d+(?:\.\d+){0,2}$/.test(version.trim())
    ? "unsupported"
    : "unknown";
}

function requiredForMode(mode: Mode): {
  packages: string[];
  imports: string[];
} {
  if (mode === "css")
    return { packages: ["@combric/tokens"], imports: ["@combric/tokens/css"] };
  if (mode === "react")
    return {
      packages: ["@combric/react", "react", "react-dom"],
      imports: ["@combric/react/css"],
    };
  if (mode === "tailwind")
    return {
      packages: ["@combric/tailwind", "tailwindcss"],
      imports: ["tailwindcss", "@combric/tailwind"],
    };
  return {
    packages: [
      "@combric/react",
      "@combric/tailwind",
      "react",
      "react-dom",
      "tailwindcss",
    ],
    imports: ["tailwindcss", "@combric/tailwind", "@combric/react/css"],
  };
}

export async function checkProject(
  options: { projectRoot?: string } = {},
): Promise<GuardResult> {
  const requested = resolve(options.projectRoot ?? process.cwd());
  let root: string;
  try {
    root = await realpath(requested);
    if (!(await stat(root)).isDirectory()) throw new Error("not a directory");
  } catch {
    throw new GuardOperationalError(
      "NO_PROJECT",
      "Project directory does not exist or cannot be read.",
    );
  }
  const diagnostics: GuardDiagnostic[] = [];
  let checkedFiles = 0;
  let checkedContracts = 0;
  const add = (
    severity: GuardSeverity,
    ruleId: string,
    message: string,
    file?: string,
    line?: number,
    column?: number,
  ): void => {
    diagnostics.push({
      ruleId,
      severity,
      message,
      ...(file ? { file } : {}),
      ...(line !== undefined && column !== undefined ? { line, column } : {}),
    });
  };

  const manifestText = await boundedRead(
    root,
    join(root, "package.json"),
    MAX_MANIFEST_BYTES,
    "package.json",
  );
  checkedFiles++;
  let manifest: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(manifestText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("not an object");
    manifest = parsed as Record<string, unknown>;
  } catch {
    throw new GuardOperationalError(
      "INVALID_MANIFEST",
      "package.json is not a valid JSON object.",
    );
  }
  const dependencies = parseDependencies(manifest);
  checkedContracts++;
  const combricNames = Object.keys(dependencies).filter((name) =>
    name.startsWith("@combric/"),
  );
  if (!combricNames.length)
    add(
      "warning",
      "GUARD_NO_COMBRIC",
      "No Combric package is declared in package.json.",
      "package.json",
    );
  else
    add(
      "pass",
      "GUARD_PACKAGES",
      `${combricNames.length} Combric package declarations inspected.`,
      "package.json",
    );

  let config: GuardConfig | null = null;
  let configText: string | null = null;
  try {
    configText = await boundedRead(
      root,
      join(root, "combric.config.json"),
      MAX_CONFIG_BYTES,
      "combric.config.json",
    );
    checkedFiles++;
    checkedContracts++;
  } catch (error) {
    if (!(
      error instanceof GuardOperationalError && error.code === "MISSING_FILE"
    ))
      throw error;
  }
  if (configText !== null) {
    try {
      const value: unknown = JSON.parse(configText);
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("not an object");
      const fields = value as Record<string, unknown>;
      if (
        fields.schemaVersion !== 1 ||
        !["pnpm", "npm", "yarn", "bun"].includes(
          String(fields.packageManager),
        ) ||
        !["css", "react", "tailwind", "react-tailwind"].includes(
          String(fields.mode),
        ) ||
        typeof fields.cssFile !== "string" ||
        !fields.cssFile
      )
        throw new Error("unsupported schema or fields");
      config = fields as unknown as GuardConfig;
      add(
        "pass",
        "GUARD_CONFIG",
        "Combric config schema 1 is valid.",
        "combric.config.json",
      );
      const unknown = Object.keys(fields).filter(
        (name) =>
          !["schemaVersion", "packageManager", "mode", "cssFile"].includes(
            name,
          ),
      );
      if (unknown.length)
        add(
          "warning",
          "GUARD_CONFIG_UNKNOWN",
          `Unknown config fields: ${unknown.sort().join(", ")}.`,
          "combric.config.json",
        );
    } catch {
      add(
        "error",
        "GUARD_CONFIG_SCHEMA",
        "combric.config.json must use supported schema version 1 and valid fields.",
        "combric.config.json",
      );
    }
  }
  if (
    config &&
    typeof manifest.packageManager === "string" &&
    manifest.packageManager.split("@")[0] !== config.packageManager
  ) {
    add(
      "error",
      "GUARD_MANAGER_CONFLICT",
      "Config packageManager conflicts with package.json.",
      "combric.config.json",
    );
  }

  const cssFiles: CssFile[] = [];
  let seenEntries = 0;
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) {
      add(
        "warning",
        "GUARD_SCAN_SKIPPED",
        "Directory is deeper than the bounded CSS scan.",
        relative(root, directory).replaceAll("\\", "/"),
      );
      return;
    }
    const entries = (await readdir(directory, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, "en"),
    );
    for (const entry of entries) {
      seenEntries++;
      if (seenEntries > MAX_ENTRIES)
        throw new GuardOperationalError(
          "SCAN_LIMIT",
          "CSS scan exceeds the supported entry count.",
        );
      if (IGNORED.has(entry.name)) continue;
      const target = join(directory, entry.name);
      const file = relative(root, target).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) {
        add(
          "warning",
          "GUARD_SYMLINK_SKIPPED",
          "Symlink skipped; Guard does not follow consumer symlinks.",
          file,
        );
      } else if (entry.isDirectory()) {
        await walk(target, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(".css")) {
        const text = await boundedRead(root, target, MAX_CSS_BYTES, file);
        checkedFiles++;
        cssFiles.push({ file, text, imports: cssImports(text) });
      }
    }
  }
  await walk(root, 0);
  cssFiles.sort((a, b) => a.file.localeCompare(b.file, "en"));

  if (config) {
    const target = safeRelativePath(root, config.cssFile);
    const file = relative(root, target).replaceAll("\\", "/");
    if (!cssFiles.some((item) => item.file === file)) {
      const text = await boundedRead(root, target, MAX_CSS_BYTES, file);
      checkedFiles++;
      cssFiles.push({ file, text, imports: cssImports(text) });
      cssFiles.sort((a, b) => a.file.localeCompare(b.file, "en"));
    }
  }
  checkedContracts++;
  const scope = config
    ? cssFiles.filter(
        (item) =>
          item.file ===
          relative(root, safeRelativePath(root, config.cssFile)).replaceAll(
            "\\",
            "/",
          ),
      )
    : cssFiles;
  const allImports = new Set(scope.flatMap((item) => item.imports));
  const expected = config ? requiredForMode(config.mode) : null;
  const expectedPackages = expected?.packages ?? [
    ...(dependencies["@combric/tokens"] ? ["@combric/tokens"] : []),
    ...(dependencies["@combric/react"]
      ? ["@combric/react", "react", "react-dom"]
      : []),
    ...(dependencies["@combric/tailwind"]
      ? ["@combric/tailwind", "tailwindcss"]
      : []),
    ...(allImports.has("@combric/tokens/css") ? ["@combric/tokens"] : []),
    ...(allImports.has("@combric/react/css")
      ? ["@combric/react", "react", "react-dom"]
      : []),
    ...(allImports.has("@combric/tailwind")
      ? ["@combric/tailwind", "tailwindcss"]
      : []),
  ];
  // A package declaration alone does not prove that a zero-config consumer
  // intends to use its CSS entry (tokens may be used only from JavaScript).
  const expectedImports = expected?.imports ?? [];
  for (const name of [...new Set(expectedPackages)]) {
    if (!dependencies[name])
      add(
        "error",
        "GUARD_PACKAGE_MISSING",
        `${name} is required by the selected Combric integration.`,
        "package.json",
      );
  }
  if (expectedPackages.includes("react") || dependencies["@combric/react"]) {
    for (const name of ["react", "react-dom"]) {
      const version = dependencies[name];
      if (!version) continue; // GUARD_PACKAGE_MISSING already reports absence.
      const status = declaredVersionStatus(version, compatibleReact);
      if (status === "unsupported")
        add(
          "error",
          "GUARD_REACT_VERSION",
          `${name} must declare React 19.`,
          "package.json",
        );
      if (status === "unknown")
        add(
          "warning",
          "GUARD_REACT_VERSION_UNKNOWN",
          `${name} version ${version} cannot be verified statically.`,
          "package.json",
        );
    }
  }
  if (
    expectedPackages.includes("tailwindcss") ||
    dependencies["@combric/tailwind"]
  ) {
    const version = dependencies.tailwindcss;
    if (version) {
      const status = declaredVersionStatus(version, compatibleTailwind);
      if (status === "unsupported")
        add(
          "error",
          "GUARD_TAILWIND_VERSION",
          "Tailwind CSS >=4.3 and <5 is required for the adapter.",
          "package.json",
        );
      if (status === "unknown")
        add(
          "warning",
          "GUARD_TAILWIND_VERSION_UNKNOWN",
          `Tailwind CSS version ${version} cannot be verified statically.`,
          "package.json",
        );
    }
  }
  for (const name of [...new Set(expectedImports)]) {
    if (!allImports.has(name))
      add(
        "error",
        "GUARD_CSS_IMPORT",
        `Required public CSS import ${name} is missing.`,
        config ? config.cssFile.replaceAll("\\", "/") : undefined,
      );
  }
  if (
    !config &&
    allImports.has("@combric/tailwind") &&
    !allImports.has("tailwindcss")
  ) {
    add(
      "error",
      "GUARD_CSS_IMPORT",
      "The Tailwind adapter CSS entry requires a tailwindcss import in the same integration.",
    );
  }
  if (
    expectedImports.length &&
    expectedImports.every((name) => allImports.has(name))
  ) {
    add("pass", "GUARD_CSS_READY", "Required public CSS imports are present.");
  }
  for (const item of cssFiles) {
    const inspectable = maskComments(item.text);
    for (const match of inspectable.matchAll(
      /@import\s+(?:url\(\s*)?["']([^"']+)["']/g,
    )) {
      const name = match[1]!;
      if (name.startsWith("@combric/") && !PUBLIC_CSS.has(name)) {
        const pos = location(item.text, match.index);
        add(
          "error",
          "GUARD_CSS_ENTRY",
          `Unsupported Combric CSS entry ${name}.`,
          item.file,
          pos.line,
          pos.column,
        );
      }
    }
    for (const match of maskStrings(inspectable).matchAll(
      /var\(\s*(--combric-[\w-]+)/g,
    )) {
      const name = match[1]!;
      if (!VALID_VARIABLES.has(name)) {
        const pos = location(item.text, match.index);
        add(
          "error",
          "GUARD_TOKEN_UNKNOWN",
          `Unknown Combric CSS variable ${name}.`,
          item.file,
          pos.line,
          pos.column,
        );
      }
    }
  }
  checkedContracts++;
  if (!diagnostics.some((item) => item.ruleId === "GUARD_TOKEN_UNKNOWN")) {
    add(
      "pass",
      "GUARD_TOKENS",
      "Referenced Combric CSS variables are public token names.",
    );
  }
  if (
    dependencies["@combric/tailwind"] &&
    allImports.has("@combric/tailwind") &&
    allImports.has("tailwindcss")
  ) {
    const containing = scope.some((item) => {
      const first = item.imports.indexOf("tailwindcss");
      const second = item.imports.indexOf("@combric/tailwind");
      return first >= 0 && second > first;
    });
    if (!containing)
      add(
        "error",
        "GUARD_TAILWIND_IMPORT",
        "Import tailwindcss before @combric/tailwind in the same CSS entry.",
      );
  }
  diagnostics.sort(
    (a, b) =>
      (a.file ?? "").localeCompare(b.file ?? "", "en") ||
      (a.line ?? 0) - (b.line ?? 0) ||
      a.ruleId.localeCompare(b.ruleId, "en") ||
      a.message.localeCompare(b.message, "en"),
  );
  return {
    schemaVersion: 1,
    projectRoot: ".",
    summary: {
      errors: diagnostics.filter((item) => item.severity === "error").length,
      warnings: diagnostics.filter((item) => item.severity === "warning")
        .length,
      checkedFiles,
      checkedContracts,
    },
    diagnostics,
  };
}

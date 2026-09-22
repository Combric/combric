import { access, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { MANAGERS, readConfig } from "./config.js";
import { CliError, type PackageManager, type ProjectInfo } from "./model.js";

const lockfiles: Record<PackageManager, string[]> = {
  pnpm: ["pnpm-lock.yaml"],
  npm: ["package-lock.json", "npm-shrinkwrap.json"],
  yarn: ["yarn.lock"],
  bun: ["bun.lock", "bun.lockb"],
};

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function findWorkspaceRoot(start: string): Promise<string | null> {
  let current = start;
  while (true) {
    if (await exists(join(current, "pnpm-workspace.yaml"))) return current;
    try {
      const manifest: unknown = JSON.parse(
        await readFile(join(current, "package.json"), "utf8"),
      );
      if (manifest && typeof manifest === "object" && "workspaces" in manifest)
        return current;
    } catch {
      // Workspace evidence is optional; malformed ancestors do not authorize edits.
    }
    if (dirname(current) === current) return null;
    current = dirname(current);
  }
}

function readDependencies(
  manifest: Record<string, unknown>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ]) {
    const value = manifest[field];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const [name, version] of Object.entries(value)) {
      if (typeof version === "string") result[name] = version;
    }
  }
  return result;
}

export async function findProjectRoot(
  start: string,
  explicit: boolean,
): Promise<string> {
  let current = await realpath(resolve(start));
  while (true) {
    if (await exists(join(current, "package.json"))) return current;
    if (explicit || dirname(current) === current) {
      throw new CliError(
        `No package.json found at ${current}. Run this in an existing package project or pass --project.`,
        "NO_PROJECT",
      );
    }
    current = dirname(current);
  }
}

export function validateRelativeFile(root: string, requested: string): string {
  if (!requested || isAbsolute(requested) || /^[A-Za-z]:/.test(requested)) {
    throw new CliError(
      "--css-file must be a project-relative CSS path.",
      "UNSAFE_PATH",
    );
  }
  const target = resolve(root, requested);
  const inside = relative(root, target);
  if (
    !inside ||
    inside === ".." ||
    inside.startsWith(`..${sep}`) ||
    isAbsolute(inside)
  ) {
    throw new CliError(
      "CSS target must stay inside the project root.",
      "UNSAFE_PATH",
    );
  }
  if (!target.endsWith(".css")) {
    throw new CliError("CSS target must be a .css file.", "UNSAFE_PATH");
  }
  return target;
}

export async function resolveCssFile(
  root: string,
  requested: string,
): Promise<string> {
  const target = validateRelativeFile(root, requested);
  let resolved: string;
  try {
    resolved = await realpath(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new CliError(
        `CSS file ${requested} does not exist. Create it and pass --css-file.`,
        "MISSING_CSS",
      );
    }
    throw error;
  }
  const inside = relative(root, resolved);
  if (
    !inside ||
    inside === ".." ||
    inside.startsWith(`..${sep}`) ||
    isAbsolute(inside)
  ) {
    throw new CliError(
      "CSS target resolves outside the project root.",
      "UNSAFE_PATH",
    );
  }
  return resolved;
}

export function cssImports(contents: string): string[] {
  const withoutComments = contents.replace(/\/\*[\s\S]*?\*\//g, "");
  return [
    ...withoutComments.matchAll(
      /^\s*@import\s+(?:url\(\s*)?["']([^"']+)["']/gm,
    ),
  ].map((match) => match[1]!);
}

export async function inspectProject(
  start: string,
  explicit = false,
): Promise<ProjectInfo> {
  const projectRoot = await findProjectRoot(start, explicit);
  let manifest: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(
      await readFile(join(projectRoot, "package.json"), "utf8"),
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("not an object");
    manifest = parsed as Record<string, unknown>;
  } catch {
    throw new CliError(
      "package.json is invalid JSON or is not an object.",
      "INVALID_MANIFEST",
    );
  }
  const dependencies = readDependencies(manifest);
  const workspaceRoot = await findWorkspaceRoot(projectRoot);
  const configState = await readConfig(projectRoot);
  const evidence: string[] = [];
  if (
    workspaceRoot &&
    (await exists(join(workspaceRoot, "pnpm-workspace.yaml")))
  ) {
    evidence.push("pnpm-workspace.yaml:pnpm");
  }
  const managerField = manifest.packageManager;
  if (typeof managerField === "string") {
    const manager = managerField.split("@")[0];
    if (MANAGERS.includes(manager as PackageManager))
      evidence.push(`packageManager:${manager}`);
    else evidence.push(`packageManager:unsupported(${manager})`);
  }
  for (const [manager, names] of Object.entries(lockfiles)) {
    for (const name of names) {
      if (await exists(join(projectRoot, name)))
        evidence.push(`${name}:${manager}`);
    }
  }
  if (workspaceRoot && workspaceRoot !== projectRoot) {
    try {
      const workspaceManifest: unknown = JSON.parse(
        await readFile(join(workspaceRoot, "package.json"), "utf8"),
      );
      if (
        workspaceManifest &&
        typeof workspaceManifest === "object" &&
        "packageManager" in workspaceManifest
      ) {
        const field = (workspaceManifest as Record<string, unknown>)
          .packageManager;
        if (typeof field === "string")
          evidence.push(`workspace-packageManager:${field.split("@")[0]}`);
      }
    } catch {
      // The nearest package manifest remains authoritative for project facts.
    }
    for (const [manager, names] of Object.entries(lockfiles)) {
      for (const name of names) {
        if (await exists(join(workspaceRoot, name)))
          evidence.push(`workspace-${name}:${manager}`);
      }
    }
  }
  if (configState.config)
    evidence.push(`config:${configState.config.packageManager}`);
  const managers = [
    ...new Set(
      evidence
        .map((item) => item.split(":")[1])
        .filter((item) => MANAGERS.includes(item as PackageManager)),
    ),
  ];
  const packageManagerConflict =
    managers.length > 1 ||
    evidence.some((item) => item.includes("unsupported"));
  const packageManager =
    !packageManagerConflict && managers.length === 1
      ? (managers[0] as PackageManager)
      : null;
  const installed: Record<string, string> = {};
  for (const name of Object.keys(dependencies).filter(
    (item) =>
      item.startsWith("@combric/") ||
      ["react", "react-dom", "tailwindcss"].includes(item),
  )) {
    try {
      const contents = await readFile(
        join(projectRoot, "node_modules", ...name.split("/"), "package.json"),
        "utf8",
      );
      const parsed: unknown = JSON.parse(contents);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as Record<string, unknown>).version === "string"
      ) {
        installed[name] = (parsed as { version: string }).version;
      }
    } catch {
      // A declared dependency need not be installed in the inspected project.
    }
  }
  let imports: string[] | null = null;
  if (configState.config && !configState.error) {
    try {
      const cssPath = await resolveCssFile(
        projectRoot,
        configState.config.cssFile,
      );
      imports = cssImports(await readFile(cssPath, "utf8"));
    } catch {
      // Doctor reports the missing or unsafe CSS target separately.
    }
  }
  return {
    projectRoot,
    nodeVersion: process.versions.node,
    packageManager,
    packageManagerEvidence: evidence,
    packageManagerConflict,
    manifest,
    dependencies,
    installed,
    react: dependencies.react ?? null,
    tailwind: dependencies.tailwindcss ?? null,
    combricPackages: Object.fromEntries(
      Object.entries(dependencies).filter(([name]) =>
        name.startsWith("@combric/"),
      ),
    ),
    config: configState.config,
    configError: configState.error,
    configUnknownFields: configState.unknownFields,
    cssImports: imports,
    workspace: workspaceRoot !== null,
    workspaceRoot,
  };
}

export function supportsReact19(version: string): boolean {
  return (
    /^(?:\^|~)?19(?:\.\d+){0,2}$/.test(version.trim()) ||
    /^>=\s*19(?:\.\d+){0,2}\s+<\s*20(?:\.0){0,2}$/.test(version.trim())
  );
}

export function supportsTailwind4(version: string): boolean {
  const value = version.trim();
  const match =
    value.match(/^(?:\^|~)?4\.(\d+)(?:\.\d+)?$/) ??
    value.match(/^>=\s*4\.(\d+)(?:\.\d+)?\s+<\s*5(?:\.0){0,2}$/);
  return Boolean(match && Number(match[1]) >= 3);
}

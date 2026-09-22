import { readFile } from "node:fs/promises";
import { relative } from "node:path";

import { CONFIG_FILE, MANAGERS, MODES, serializeConfig } from "./config.js";
import {
  cssImports,
  resolveCssFile,
  supportsReact19,
  supportsTailwind4,
} from "./inspect.js";
import {
  CliError,
  type CliConfig,
  type InitPlan,
  type Mode,
  type PackageManager,
  type ProjectInfo,
} from "./model.js";
import { requiredImports, requiredPackages } from "./requirements.js";

export interface InitOptions {
  mode?: string | undefined;
  cssFile?: string | undefined;
  packageManager?: string | undefined;
}

function addImports(contents: string, missing: string[]): string {
  if (!missing.length) return contents;
  const newline = contents.includes("\r\n") ? "\r\n" : "\n";
  const lines =
    missing.map((name) => `@import "${name}";`).join(newline) + newline;
  const charset = contents.match(/^(@charset\s+["'][^"']+["'];\s*(?:\r?\n))/);
  if (charset) return charset[0] + lines + contents.slice(charset[0].length);
  return lines + contents;
}

export async function planInit(
  project: ProjectInfo,
  options: InitOptions,
): Promise<InitPlan> {
  if (project.configError)
    throw new CliError(project.configError, "INVALID_CONFIG");
  if (project.configUnknownFields.length) {
    throw new CliError(
      "Existing config has unknown fields. Review it manually before running init.",
      "CONFIG_CONFLICT",
    );
  }
  if (project.packageManagerConflict) {
    throw new CliError(
      `Conflicting package-manager evidence: ${project.packageManagerEvidence.join(", ")}. Resolve the project metadata or lockfiles first.`,
      "PACKAGE_MANAGER_CONFLICT",
    );
  }
  const mode = options.mode ?? project.config?.mode;
  if (!mode || !MODES.includes(mode as Mode)) {
    throw new CliError(
      "Choose --mode css|react|tailwind|react-tailwind.",
      "MODE_REQUIRED",
    );
  }
  const manager =
    options.packageManager ??
    project.packageManager ??
    project.config?.packageManager;
  if (!manager || !MANAGERS.includes(manager as PackageManager)) {
    throw new CliError(
      "Choose --package-manager pnpm|npm|yarn|bun; no reliable project evidence was found.",
      "PACKAGE_MANAGER_REQUIRED",
    );
  }
  if (
    project.packageManager &&
    options.packageManager &&
    options.packageManager !== project.packageManager
  ) {
    throw new CliError(
      `Selected ${options.packageManager} conflicts with detected ${project.packageManager}.`,
      "PACKAGE_MANAGER_CONFLICT",
    );
  }
  const cssFile = options.cssFile ?? project.config?.cssFile;
  if (!cssFile)
    throw new CliError(
      "Pass --css-file with an existing project-relative CSS entry.",
      "CSS_FILE_REQUIRED",
    );
  const cssPath = await resolveCssFile(project.projectRoot, cssFile);
  const relativeCss = relative(project.projectRoot, cssPath).replaceAll(
    "\\",
    "/",
  );
  const requested: CliConfig = {
    schemaVersion: 1,
    packageManager: manager as PackageManager,
    mode: mode as Mode,
    cssFile: relativeCss,
  };
  if (
    project.config &&
    JSON.stringify(project.config) !== JSON.stringify(requested)
  ) {
    throw new CliError(
      "Requested setup conflicts with existing combric.config.json. Review the config manually; init will not overwrite it.",
      "CONFIG_CONFLICT",
    );
  }
  const selectedMode = mode as Mode;
  if (
    selectedMode.includes("tailwind") &&
    (!project.tailwind || !supportsTailwind4(project.tailwind))
  ) {
    throw new CliError(
      "Tailwind mode requires an existing Tailwind CSS >=4.3 <5 project. Install or upgrade Tailwind first.",
      "TAILWIND_UNSUPPORTED",
    );
  }
  if (selectedMode.includes("react")) {
    for (const name of ["react", "react-dom"]) {
      if (
        project.dependencies[name] &&
        !supportsReact19(project.dependencies[name])
      ) {
        throw new CliError(
          `${name} must satisfy React 19 before selecting React mode.`,
          "REACT_UNSUPPORTED",
        );
      }
    }
  }
  const originalCss = await readFile(cssPath, "utf8");
  const imports = cssImports(originalCss);
  const needed = requiredImports(selectedMode);
  const conflicting = imports.filter(
    (name) => name.startsWith("@combric/") && !needed.includes(name),
  );
  if (conflicting.length) {
    throw new CliError(
      `Existing Combric CSS imports conflict with ${selectedMode} mode: ${conflicting.join(", ")}. Edit the CSS manually.`,
      "CSS_CONFLICT",
    );
  }
  if (
    imports
      .filter((name) => needed.includes(name))
      .some((name, index, all) => all.indexOf(name) !== index)
  ) {
    throw new CliError(
      "CSS contains duplicate Combric imports. Resolve them manually.",
      "CSS_CONFLICT",
    );
  }
  const actions: InitPlan["actions"] = [];
  const packages = requiredPackages(selectedMode).filter(
    (name) => !project.dependencies[name],
  );
  if (selectedMode.includes("react")) {
    for (const name of ["react", "react-dom"])
      if (!project.dependencies[name]) packages.push(`${name}@19`);
  }
  if (project.workspaceRoot === project.projectRoot && packages.length) {
    throw new CliError(
      "This is a workspace root. Select a member package with --project, or install the packages manually at the intended workspace scope.",
      "WORKSPACE_SCOPE_REQUIRED",
    );
  }
  if (packages.length)
    actions.push({
      type: "install",
      target: "package.json and lockfile",
      reason: `Install packages required for ${selectedMode} mode.`,
      changesState: true,
      packages,
    });
  const updatedCss = addImports(
    originalCss,
    needed.filter((name) => !imports.includes(name)),
  );
  if (updatedCss !== originalCss) {
    actions.push({
      type: "update-css",
      target: relativeCss,
      reason: "Add public Combric CSS imports.",
      changesState: true,
      content: updatedCss,
      before: originalCss,
    });
  }
  if (!project.config) {
    actions.push({
      type: "create-config",
      target: CONFIG_FILE,
      reason: "Record the selected setup for repeatable checks.",
      changesState: true,
      content: serializeConfig(requested),
      before: null,
    });
  }
  return {
    projectRoot: project.projectRoot,
    packageManager: manager as PackageManager,
    mode: selectedMode,
    cssFile: relativeCss,
    actions,
  };
}

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { resolveCssFile } from "./inspect.js";
import { CliError, type InitPlan, type PackageManager } from "./model.js";

function installPackages(
  manager: PackageManager,
  packages: string[],
  cwd: string,
): void {
  let executable: string = manager;
  let args = ["add", ...packages];
  const activeCli = process.env.npm_execpath;
  if (activeCli && basename(activeCli).toLowerCase().includes(manager)) {
    executable = process.execPath;
    args = [activeCli, ...args];
  } else if (process.platform === "win32") {
    // Node cannot spawn .cmd shims without a shell. Require the manager's own
    // JavaScript entry rather than interpolating a consumer project into cmd.exe.
    throw new CliError(
      `On Windows, run Combric through ${manager} exec so npm_execpath identifies the selected package manager. No files were changed.`,
      "MANAGER_ENTRY_REQUIRED",
      2,
    );
  }
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.error || result.status !== 0) {
    throw new CliError(
      `${manager} could not install ${packages.join(", ")}. These packages may still be unreleased; use a local tarball/workspace or wait for publication. Package-manager files may have changed, but Combric CSS/config was not written. ${result.error?.message ?? (result.stderr || result.stdout).trim()}`,
      "INSTALL_FAILED",
      2,
    );
  }
}

async function writeCssAtomically(
  path: string,
  content: string,
): Promise<void> {
  const temporary = join(
    dirname(path),
    `.${basename(path)}.combric-${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function executePlan(plan: InitPlan): Promise<string[]> {
  const changed: string[] = [];
  const cssAction = plan.actions.find((action) => action.type === "update-css");
  const configAction = plan.actions.find(
    (action) => action.type === "create-config",
  );
  const cssPath = await resolveCssFile(plan.projectRoot, plan.cssFile);
  if (cssAction && (await readFile(cssPath, "utf8")) !== cssAction.before) {
    throw new CliError(
      "CSS file changed since the plan was created. Run init again.",
      "STALE_PLAN",
    );
  }
  const configPath = join(plan.projectRoot, "combric.config.json");
  if (configAction) {
    try {
      await readFile(configPath, "utf8");
      throw new CliError(
        "Combric config appeared since planning. Run init again.",
        "STALE_PLAN",
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  try {
    const install = plan.actions.find((action) => action.type === "install");
    if (install?.packages?.length) {
      installPackages(plan.packageManager, install.packages, plan.projectRoot);
      changed.push(`installed ${install.packages.join(", ")}`);
    }
    if (cssAction?.content !== undefined) {
      const currentPath = await resolveCssFile(plan.projectRoot, plan.cssFile);
      if ((await readFile(currentPath, "utf8")) !== cssAction.before) {
        throw new CliError(
          "CSS file changed during installation. Review package-manager changes and run init again.",
          "STALE_PLAN",
          2,
        );
      }
      await writeCssAtomically(currentPath, cssAction.content);
      changed.push(`updated ${plan.cssFile}`);
    }
    if (configAction?.content !== undefined) {
      await writeFile(configPath, configAction.content, {
        encoding: "utf8",
        flag: "wx",
      });
      changed.push("created combric.config.json");
    }
    return changed;
  } catch (error) {
    if (error instanceof CliError && !changed.length) throw error;
    throw new CliError(
      `Init stopped after: ${changed.length ? changed.join("; ") : "no completed operations"}. ${error instanceof Error ? error.message : String(error)} Review the project before retrying.`,
      "PARTIAL_INIT",
      2,
    );
  }
}

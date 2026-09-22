import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { diagnose } from "./doctor.js";
import { executePlan } from "./execute.js";
import { inspectProject } from "./inspect.js";
import { CliError, type InitPlan } from "./model.js";
import { planInit } from "./plan.js";

const help = `Combric CLI — optional setup and diagnostics for package-based Combric projects.

Usage: combric <command> [options]

Commands:
  init      Configure an existing project (no app scaffolding)
  doctor    Check project health without changing files
  info      Show detected project state without changing files

Global options:
  --help             Show help
  --version          Show CLI package version
  --project <path>   Inspect an explicit existing project directory

Run combric <command> --help for command options.
Packages can be installed and used manually without this CLI.`;

const commandHelp: Record<string, string> = {
  init: `Usage: combric init --mode <css|react|tailwind|react-tailwind> --css-file <relative.css> [options]

Configure an existing package project. The CSS file must already exist.
  --package-manager <pnpm|npm|yarn|bun>  Required if project evidence is absent
  --dry-run                            Print the plan without changing files
  --yes                                Apply the plan without prompts
  --json                               Machine-readable plan/result
  --project <path>                     Explicit existing project directory
  --help                               Show this help`,
  doctor: `Usage: combric doctor [--json] [--project <path>]

Read-only diagnostics. Exit 0 for pass/warnings, 1 for detected errors, 2 for operational failure.`,
  info: `Usage: combric info [--json] [--project <path>]

Read-only project facts. Exit 0 on success, 1 for user/configuration error, 2 for operational failure.`,
};

const optionDefinitions = {
  help: { type: "boolean" },
  version: { type: "boolean" },
  project: { type: "string" },
  json: { type: "boolean" },
  yes: { type: "boolean" },
  "dry-run": { type: "boolean" },
  mode: { type: "string" },
  "css-file": { type: "string" },
  "package-manager": { type: "string" },
} as const;

function emitJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function publicPlan(plan: InitPlan): object {
  return {
    schemaVersion: 1,
    projectRoot: plan.projectRoot,
    packageManager: plan.packageManager,
    mode: plan.mode,
    cssFile: plan.cssFile,
    actions: plan.actions.map(
      ({ type, target, reason, changesState, packages }) => ({
        type,
        target,
        reason,
        changesState,
        ...(packages ? { packages } : {}),
      }),
    ),
  };
}

export async function runCli(argv: string[]): Promise<number> {
  let jsonRequested = argv.includes("--json");
  try {
    const parsed = (() => {
      try {
        return parseArgs({
          args: argv,
          options: optionDefinitions,
          allowPositionals: true,
          strict: true,
        });
      } catch (error) {
        throw new CliError(
          error instanceof Error ? error.message : String(error),
          "INVALID_ARGUMENTS",
        );
      }
    })();
    const command = parsed.positionals[0];
    const options = parsed.values;
    jsonRequested = options.json ?? false;
    if (options.version) {
      if (command)
        throw new CliError(
          "--version is a global option.",
          "INVALID_ARGUMENTS",
        );
      const manifest = JSON.parse(
        await readFile(new URL("../package.json", import.meta.url), "utf8"),
      ) as { version: string };
      process.stdout.write(`${manifest.version}\n`);
      return 0;
    }
    if (options.help || !command) {
      process.stdout.write(
        `${command && commandHelp[command] ? commandHelp[command] : help}\n`,
      );
      return 0;
    }
    if (!(command in commandHelp))
      throw new CliError(
        `Unknown command ${command}. Run combric --help.`,
        "UNKNOWN_COMMAND",
      );
    if (parsed.positionals.length > 1)
      throw new CliError(
        "Only one command is supported. Run combric --help.",
        "INVALID_ARGUMENTS",
      );
    if (
      command !== "init" &&
      (options.yes ||
        options["dry-run"] ||
        options.mode ||
        options["css-file"] ||
        options["package-manager"])
    ) {
      throw new CliError(
        `These options are only supported by init. Run combric ${command} --help.`,
        "INVALID_ARGUMENTS",
      );
    }
    const project = await inspectProject(
      options.project ? resolve(options.project) : process.cwd(),
      Boolean(options.project),
    );
    if (command === "info") {
      const data = {
        schemaVersion: 1,
        cliVersion: (
          JSON.parse(
            await readFile(new URL("../package.json", import.meta.url), "utf8"),
          ) as { version: string }
        ).version,
        nodeVersion: project.nodeVersion,
        projectRoot: project.projectRoot,
        packageManager: project.packageManager,
        packageManagerEvidence: project.packageManagerEvidence,
        packageManagerConflict: project.packageManagerConflict,
        workspace: project.workspace,
        workspaceRoot: project.workspaceRoot,
        react: project.react,
        tailwind: project.tailwind,
        combricPackages: project.combricPackages,
        installed: project.installed,
        config: project.config,
        configError: project.configError,
        cssImports: project.cssImports,
      };
      if (options.json) emitJson(data);
      else
        process.stdout.write(
          `Project: ${data.projectRoot}\nNode: ${data.nodeVersion}\nPackage manager: ${data.packageManager ?? "unknown"}\nReact: ${data.react ?? "absent"}\nTailwind: ${data.tailwind ?? "absent"}\nCombric packages: ${Object.keys(data.combricPackages).join(", ") || "none"}\nConfig: ${data.config ? `${data.config.mode} (${data.config.cssFile})` : data.configError ? `invalid: ${data.configError}` : "absent"}\n`,
        );
      return 0;
    }
    if (command === "doctor") {
      const checks = diagnose(project);
      const status = checks.some((item) => item.severity === "error")
        ? "error"
        : "ok";
      if (options.json)
        emitJson({
          schemaVersion: 1,
          projectRoot: project.projectRoot,
          status,
          checks,
        });
      else
        process.stdout.write(
          `Combric doctor: ${status}\n${checks.map((item) => `[${item.severity}] ${item.code}: ${item.message}`).join("\n")}\n`,
        );
      return status === "error" ? 1 : 0;
    }
    const plan = await planInit(project, {
      mode: options.mode,
      cssFile: options["css-file"],
      packageManager: options["package-manager"],
    });
    if (options["dry-run"]) {
      if (options.json) emitJson({ ...publicPlan(plan), dryRun: true });
      else
        process.stdout.write(
          `Combric init dry run: ${plan.mode}\n${plan.actions.length ? plan.actions.map((action) => `- ${action.type}: ${action.target} — ${action.reason}${action.packages ? ` (${action.packages.join(", ")})` : ""}`).join("\n") : "No changes required."}\n`,
        );
      return 0;
    }
    if (plan.actions.length && !options.yes)
      throw new CliError(
        "Pass --yes to apply this plan, or --dry-run to inspect it. No prompt will be opened.",
        "CONFIRMATION_REQUIRED",
      );
    const changed = await executePlan(plan);
    if (options.json) emitJson({ ...publicPlan(plan), dryRun: false, changed });
    else
      process.stdout.write(
        `Combric init: ${changed.length ? changed.join("; ") : "no changes required"}.\n`,
      );
    return 0;
  } catch (error) {
    const known =
      error instanceof CliError
        ? error
        : new CliError(
            error instanceof Error ? error.message : String(error),
            "OPERATION_FAILED",
            2,
          );
    if (jsonRequested)
      emitJson({
        schemaVersion: 1,
        error: { code: known.code, message: known.message },
        exitCode: known.exitCode,
      });
    else process.stderr.write(`Combric: ${known.message}\n`);
    return known.exitCode;
  }
}

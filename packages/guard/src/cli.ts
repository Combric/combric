import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { checkProject, GuardOperationalError } from "./check.js";

const help = `Combric Guard — read-only, offline checks for a consumer project.

Usage: combric-guard [check] [--json] [--project <directory>]

Commands:
  check             Inspect an existing package project (default)

Options:
  --json            Print versioned machine-readable results
  --project <path>  Inspect an explicit project directory
  --help            Show this help without reading a project
  --version         Show package version

Exit 0: no errors; 1: rule violations; 2: unable to complete.
Guard never modifies files or executes consumer code.`;

export async function runGuardCli(argv: string[]): Promise<number> {
  const jsonRequested = argv.includes("--json");
  try {
    const parsed = parseArgs({
      args: argv,
      options: {
        json: { type: "boolean" },
        project: { type: "string" },
        help: { type: "boolean" },
        version: { type: "boolean" },
      },
      allowPositionals: true,
      strict: true,
    });
    if (
      parsed.positionals.length > 1 ||
      (parsed.positionals[0] && parsed.positionals[0] !== "check")
    ) {
      throw new GuardOperationalError(
        "INVALID_ARGUMENTS",
        "Use combric-guard check or --help.",
      );
    }
    if (parsed.values.help) {
      process.stdout.write(`${help}\n`);
      return 0;
    }
    if (parsed.values.version) {
      const metadata = JSON.parse(
        await readFile(new URL("../package.json", import.meta.url), "utf8"),
      ) as { version: string };
      process.stdout.write(`${metadata.version}\n`);
      return 0;
    }
    const result = await checkProject({
      projectRoot: resolve(parsed.values.project ?? process.cwd()),
    });
    if (parsed.values.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stdout.write(
        `Combric Guard: ${result.summary.errors} errors, ${result.summary.warnings} warnings; ${result.summary.checkedFiles} files checked.\n`,
      );
      for (const item of result.diagnostics) {
        const location = item.file
          ? `${item.file}${item.line ? `:${item.line}:${item.column}` : ""}: `
          : "";
        process.stdout.write(
          `[${item.severity}] ${item.ruleId}: ${location}${item.message}\n`,
        );
      }
    }
    return result.summary.errors ? 1 : 0;
  } catch (error) {
    const known =
      error instanceof GuardOperationalError
        ? error
        : new GuardOperationalError(
            "OPERATION_FAILED",
            "Could not read the project; check permissions and filesystem state.",
          );
    if (jsonRequested) {
      process.stdout.write(
        `${JSON.stringify({ schemaVersion: 1, error: { code: known.code, message: known.message }, exitCode: 2 }, null, 2)}\n`,
      );
    } else {
      process.stderr.write(`Combric Guard: ${known.message}\n`);
    }
    return 2;
  }
}

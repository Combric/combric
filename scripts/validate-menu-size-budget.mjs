import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) {
  throw new Error("Menu size budget validation must be invoked through pnpm");
}

const root = fileURLToPath(new URL("../", import.meta.url));
const budget = JSON.parse(
  await readFile(
    new URL("./package-size-budget.json", import.meta.url),
    "utf8",
  ),
);

if (budget.schemaVersion !== 1 || budget.packages?.menu === undefined) {
  throw new Error("Menu size budget configuration is invalid");
}

const temporary = await mkdtemp(join(tmpdir(), "combric-menu-size-budget-"));

function runPnpm(arguments_, cwd) {
  const result = spawnSync(process.execPath, [pnpmCli, ...arguments_], {
    cwd,
    encoding: "utf8",
    timeout: 60_000,
  });

  if (result.status !== 0) {
    throw new Error(
      `pnpm ${arguments_.join(" ")} failed for ${cwd}: ${result.stderr}`,
    );
  }

  return result.stdout;
}

try {
  const reports = [];

  for (const [directory, limits] of Object.entries(budget.packages).sort()) {
    if (
      !Number.isInteger(limits.maxTarballBytes) ||
      limits.maxTarballBytes <= 0 ||
      !Number.isInteger(limits.maxFileCount) ||
      limits.maxFileCount <= 0
    ) {
      throw new Error(`Invalid size budget for @combric/${directory}`);
    }

    const packageDirectory = join(root, "packages", directory);
    const manifest = JSON.parse(
      await readFile(join(packageDirectory, "package.json"), "utf8"),
    );
    const tarballName = `${manifest.name.replace("@", "").replace("/", "-")}-${manifest.version}.tgz`;

    runPnpm(["pack", "--pack-destination", temporary], packageDirectory);
    const tarballBytes = (await stat(join(temporary, tarballName))).size;
    const dryRun = JSON.parse(
      runPnpm(["pack", "--dry-run", "--json"], packageDirectory),
    );
    const fileCount = dryRun.files.length;

    if (tarballBytes > limits.maxTarballBytes) {
      throw new Error(
        `@combric/${directory} tarball is ${tarballBytes} B; budget is ${limits.maxTarballBytes} B`,
      );
    }
    if (fileCount > limits.maxFileCount) {
      throw new Error(
        `@combric/${directory} contains ${fileCount} files; budget is ${limits.maxFileCount}`,
      );
    }

    reports.push(
      `@combric/${directory}: ${tarballBytes} B / ${limits.maxTarballBytes} B, ${fileCount} / ${limits.maxFileCount} files`,
    );
  }

  console.log(`Validated menu package budget: ${reports.join("; ")}.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

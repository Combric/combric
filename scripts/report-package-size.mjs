import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) throw new Error("Run the package-size report through pnpm");
const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "combric-size-report-"));
const names = ["core", "tokens", "layout", "react", "cli", "guard", "tailwind"];
const baseline = JSON.parse(
  await readFile(
    new URL("./package-size-baseline.json", import.meta.url),
    "utf8",
  ),
);
const report = [];

try {
  for (const name of names) {
    const cwd = join(root, "packages", name);
    const packed = spawnSync(
      process.execPath,
      [pnpmCli, "pack", "--pack-destination", temporary],
      {
        cwd,
        encoding: "utf8",
        timeout: 60_000,
      },
    );
    if (packed.status !== 0)
      throw new Error(`Pack failed for ${name}: ${packed.stderr}`);
    const manifest = JSON.parse(
      await readFile(join(cwd, "package.json"), "utf8"),
    );
    const filename = `combric-${name}-${manifest.version}.tgz`;
    const bytes = (await stat(join(temporary, filename))).size;
    const dry = spawnSync(
      process.execPath,
      [pnpmCli, "pack", "--dry-run", "--json"],
      {
        cwd,
        encoding: "utf8",
        timeout: 60_000,
      },
    );
    if (dry.status !== 0)
      throw new Error(`Pack dry-run failed for ${name}: ${dry.stderr}`);
    const fileCount = JSON.parse(dry.stdout).files.length;
    report.push({
      package: `@combric/${name}`,
      tarballBytes: bytes,
      fileCount,
      baselineBytes: baseline.packages[name].tarballBytes,
      baselineFileCount: baseline.packages[name].fileCount,
      deltaBytes: bytes - baseline.packages[name].tarballBytes,
      deltaFiles: fileCount - baseline.packages[name].fileCount,
    });
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        scope: "repository-package-baseline",
        publicReleasePackages: names
          .filter((name) => name !== "core")
          .map((name) => `@combric/${name}`),
        report,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}

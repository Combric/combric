import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageNames = [
  "core",
  "tokens",
  "layout",
  "react",
  "cli",
  "guard",
  "tailwind",
];
const pnpmCli = process.env.npm_execpath;

if (!pnpmCli) {
  throw new Error("Package dry-run validation must be invoked through pnpm");
}

for (const packageName of packageNames) {
  const packageDirectory = fileURLToPath(
    new URL(`../packages/${packageName}/`, import.meta.url),
  );
  const result = spawnSync(
    process.execPath,
    [pnpmCli, "pack", "--dry-run", "--json"],
    {
      cwd: packageDirectory,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Pack dry-run failed for @combric/${packageName}: ${result.stderr}`,
    );
  }

  const pack = JSON.parse(result.stdout);
  const filePaths = new Set(pack.files.map(({ path }) => path));
  const requiredFiles =
    packageName === "layout" || packageName === "tailwind"
      ? ["dist/index.css", "LICENSE", "README.md", "package.json"]
      : ["dist/index.d.ts", "dist/index.js", "LICENSE", "package.json"];

  if (packageName === "tokens") {
    requiredFiles.push("dist/tokens.css", "README.md");
  }

  if (packageName === "react") {
    requiredFiles.push("dist/index.css", "README.md");
  }
  if (packageName === "cli") {
    requiredFiles.push("dist/bin.js", "README.md");
  }
  if (packageName === "guard") {
    requiredFiles.push("dist/bin.js", "dist/check.d.ts", "README.md");
  }

  for (const requiredFile of requiredFiles) {
    if (!filePaths.has(requiredFile)) {
      throw new Error(
        `@combric/${packageName} tarball is missing ${requiredFile}`,
      );
    }
  }

  if ([...filePaths].some((path) => path.startsWith("src/"))) {
    throw new Error(`@combric/${packageName} tarball must not contain src/`);
  }
  if (
    (packageName === "cli" || packageName === "guard") &&
    [...filePaths].some(
      (path) => path.startsWith("test/") || path.startsWith("fixtures/"),
    )
  ) {
    throw new Error(
      `@combric/${packageName} tarball must not contain tests or fixtures`,
    );
  }
}

console.log(`Validated ${packageNames.length} package dry-runs.`);

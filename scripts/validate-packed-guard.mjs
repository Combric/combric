import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) throw new Error("Run packed Guard verification through pnpm");
const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "combric-packed-guard-"));

function pnpm(args, cwd, expected = 0) {
  const result = spawnSync(process.execPath, [pnpmCli, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 60_000,
  });
  if (result.status !== expected) {
    throw new Error(
      `pnpm ${args.join(" ")} exited ${result.status}, expected ${expected}:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout;
}

try {
  const version = "1.1.0";
  for (const name of ["tokens", "guard"]) {
    pnpm(
      ["pack", "--pack-destination", temporary],
      join(root, "packages", name),
    );
  }
  const manifest = {
    name: "packed-guard-consumer",
    private: true,
    type: "module",
    packageManager: "pnpm@11.19.0",
    dependencies: {
      "@combric/tokens": `file:./combric-tokens-${version}.tgz`,
      "@combric/guard": `file:./combric-guard-${version}.tgz`,
    },
  };
  await writeFile(
    join(temporary, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(
    join(temporary, "pnpm-workspace.yaml"),
    `overrides:\n  '@combric/tokens': file:./combric-tokens-${version}.tgz\n`,
  );
  await writeFile(
    join(temporary, "style.css"),
    '@import "@combric/tokens/css";\nbody { color: var(--combric-color-text); }\n',
  );
  pnpm(["install", "--offline", "--ignore-scripts"], temporary);
  const installed = JSON.parse(
    await readFile(
      join(temporary, "node_modules", "@combric", "guard", "package.json"),
      "utf8",
    ),
  );
  if (installed.bin?.["combric-guard"] !== "./dist/bin.js")
    throw new Error("Packed Guard bin metadata is missing");
  const bin = join(
    temporary,
    "node_modules",
    "@combric",
    "guard",
    "dist",
    "bin.js",
  );
  if (!(await readFile(bin, "utf8")).startsWith("#!/usr/bin/env node"))
    throw new Error("Packed Guard bin has no shebang");
  const help = pnpm(["exec", "combric-guard", "--help"], temporary);
  if (!help.includes("read-only")) throw new Error("Packed Guard help failed");
  if (
    pnpm(["exec", "combric-guard", "--version"], temporary).trim() !==
    installed.version
  )
    throw new Error("Packed Guard version failed");
  const before = await readFile(join(temporary, "style.css"), "utf8");
  const healthy = JSON.parse(
    pnpm(["exec", "combric-guard", "check", "--json"], temporary),
  );
  if (
    healthy.schemaVersion !== 1 ||
    healthy.projectRoot !== "." ||
    healthy.summary.errors !== 0
  )
    throw new Error("Packed healthy check failed");
  await writeFile(
    join(temporary, "style.css"),
    '@import "@combric/tokens/css";\nbody { color: var(--combric-not-real); }\n',
  );
  const violating = JSON.parse(
    pnpm(["exec", "combric-guard", "check", "--json"], temporary, 1),
  );
  if (
    !violating.diagnostics.some((item) => item.ruleId === "GUARD_TOKEN_UNKNOWN")
  )
    throw new Error("Packed violating check failed");
  const missing = join(temporary, "missing-project");
  const operational = JSON.parse(
    pnpm(
      ["exec", "combric-guard", "check", "--project", missing, "--json"],
      temporary,
      2,
    ),
  );
  if (operational.error?.code !== "NO_PROJECT")
    throw new Error("Packed operational exit failed");
  const actualNames = await readdir(temporary);
  if (
    actualNames.includes("combric.config.json") ||
    !before.includes("@combric/tokens/css")
  )
    throw new Error("Packed check changed consumer configuration");
  const canonical = await realpath(temporary);
  if (!canonical) throw new Error("Temporary consumer disappeared");
  console.log(
    "Validated packed Combric Guard: healthy 0, violation 1, operational 2.",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}

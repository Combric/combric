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
if (!pnpmCli) throw new Error("Run the packed CLI check through pnpm");
const packageDirectory = fileURLToPath(
  new URL("../packages/cli/", import.meta.url),
);
const temporary = await mkdtemp(join(tmpdir(), "combric-packed-cli-"));

function pnpm(args, cwd) {
  const result = spawnSync(process.execPath, [pnpmCli, ...args], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `pnpm ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
  return result.stdout;
}

try {
  pnpm(["pack", "--pack-destination", temporary], packageDirectory);
  const sourceManifest = JSON.parse(
    await readFile(join(packageDirectory, "package.json"), "utf8"),
  );
  const tarball = `combric-cli-${sourceManifest.version}.tgz`;
  const manifest = {
    name: "packed-cli-consumer",
    private: true,
    type: "module",
    packageManager: "pnpm@11.19.0",
    dependencies: { "@combric/cli": `file:./${tarball}` },
  };
  await writeFile(
    join(temporary, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(join(temporary, "style.css"), "body { color: inherit; }\n");
  pnpm(["install", "--offline", "--ignore-scripts"], temporary);
  const packedManifest = JSON.parse(
    await readFile(
      join(temporary, "node_modules", "@combric", "cli", "package.json"),
      "utf8",
    ),
  );
  if (
    packedManifest.name !== "@combric/cli" ||
    packedManifest.bin?.combric !== "./dist/bin.js"
  ) {
    throw new Error("Packed CLI metadata has no executable bin contract");
  }
  const packedBin = join(
    temporary,
    "node_modules",
    "@combric",
    "cli",
    "dist",
    "bin.js",
  );
  if (!(await readFile(packedBin, "utf8")).startsWith("#!/usr/bin/env node")) {
    throw new Error("Packed CLI bin is missing its Node shebang");
  }
  const help = pnpm(["exec", "combric", "--help"], temporary);
  if (!help.includes("combric init") && !help.includes("  init"))
    throw new Error("Packed help failed");
  if (
    pnpm(["exec", "combric", "--version"], temporary).trim() !==
    packedManifest.version
  ) {
    throw new Error("Packed version did not match package metadata");
  }
  const info = JSON.parse(
    pnpm(["exec", "combric", "info", "--json"], temporary),
  );
  const expectedRoot = await realpath(temporary);
  if (info.projectRoot !== expectedRoot || info.packageManager !== "pnpm")
    throw new Error(
      `Packed info failed: ${JSON.stringify({ actualRoot: info.projectRoot, expectedRoot, packageManager: info.packageManager, packageManagerEvidence: info.packageManagerEvidence })}`,
    );
  const doctor = JSON.parse(
    pnpm(["exec", "combric", "doctor", "--json"], temporary),
  );
  if (doctor.status !== "ok") throw new Error("Packed doctor failed");
  const before = await readFile(join(temporary, "style.css"), "utf8");
  const dry = JSON.parse(
    pnpm(
      [
        "exec",
        "combric",
        "init",
        "--mode",
        "css",
        "--css-file",
        "style.css",
        "--dry-run",
        "--json",
      ],
      temporary,
    ),
  );
  if (!dry.dryRun || !dry.actions.some(({ type }) => type === "install"))
    throw new Error("Packed init plan failed");
  if (
    (await readFile(join(temporary, "style.css"), "utf8")) !== before ||
    (await readdir(temporary)).includes("combric.config.json")
  ) {
    throw new Error("Packed dry run changed the consumer");
  }
  console.log("Validated packed Combric CLI executable and dry run.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import {
  loadReleaseContract,
  readJson,
  repositoryRoot,
  validatePackedDependencies,
} from "./lib/release-contract.mjs";

const pnpmCli = process.env.npm_execpath;
const outputFlag = process.argv.indexOf("--output");
const requestedOutput =
  outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
if (outputFlag >= 0 && !requestedOutput)
  throw new Error("--output requires a directory");
const temporary = requestedOutput
  ? undefined
  : await mkdtemp(join(tmpdir(), "combric-release-"));
const output = requestedOutput
  ? join(repositoryRoot, requestedOutput)
  : temporary;

const expectedFiles = {
  tokens: ["dist/index.d.ts", "dist/index.js", "dist/tokens.css"],
  layout: ["dist/index.css"],
  react: ["dist/index.d.ts", "dist/index.js", "dist/index.css"],
  tailwind: ["dist/index.css"],
  cli: ["dist/index.d.ts", "dist/index.js", "dist/bin.js"],
  guard: ["dist/index.d.ts", "dist/index.js", "dist/bin.js", "dist/check.d.ts"],
};
const secretPatterns = [
  /(?:^|\W)npm_[A-Za-z0-9]{30,}/,
  /(?:^|\W)gh[pousr]_[A-Za-z0-9]{30,}/,
  /_authToken\s*=/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
];

function run(command, args, cwd) {
  const executable =
    command === "pnpm"
      ? pnpmCli
        ? /\.(?:c|m)?js$/i.test(pnpmCli)
          ? process.execPath
          : pnpmCli
        : process.platform === "win32"
          ? "pnpm.cmd"
          : "pnpm"
      : command;
  const commandArgs =
    command === "pnpm" && pnpmCli && /\.(?:c|m)?js$/i.test(pnpmCli)
      ? [pnpmCli, ...args]
      : args;
  const result = spawnSync(executable, commandArgs, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    shell:
      process.platform === "win32" && executable.toLowerCase().endsWith(".cmd"),
  });
  if (result.status !== 0)
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
}

async function listFiles(directory, base = directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await listFiles(path, base)));
    else result.push(relative(base, path).replaceAll("\\", "/"));
  }
  return result.sort();
}

try {
  if (requestedOutput) {
    await mkdir(output, { recursive: true });
    if ((await readdir(output)).length > 0)
      throw new Error("Release output directory must be empty");
  }
  const { contract } = await loadReleaseContract();
  const report = {
    schemaVersion: 1,
    version: contract.version,
    tag: contract.tag,
    distTag: contract.distTag,
    packages: [],
  };

  for (const entry of contract.packages) {
    const packageDirectory = join(repositoryRoot, "packages", entry.directory);
    run("pnpm", ["pack", "--pack-destination", output], packageDirectory);
    const filename = `combric-${entry.directory}-${contract.version}.tgz`;
    const tarball = join(output, filename);
    const extraction = await mkdtemp(
      join(tmpdir(), `combric-${entry.directory}-`),
    );
    try {
      run("tar", ["-xzf", tarball, "-C", extraction], repositoryRoot);
      const packedRoot = join(extraction, "package");
      const manifest = await readJson(join(packedRoot, "package.json"));
      const files = await listFiles(packedRoot);
      if (manifest.name !== entry.name || manifest.version !== contract.version)
        throw new Error(`${entry.name} packed identity is invalid`);
      if (
        manifest.license !== "MIT" ||
        manifest.repository?.url !==
          "git+https://github.com/Combric/combric.git"
      )
        throw new Error(`${entry.name} packed metadata is invalid`);
      if (
        manifest.publishConfig?.access !== "public" ||
        manifest.publishConfig?.provenance !== true
      )
        throw new Error(`${entry.name} packed publication policy is invalid`);
      validatePackedDependencies(entry, manifest, contract.version);
      if (
        entry.directory === "cli" &&
        manifest.bin?.combric !== "./dist/bin.js"
      )
        throw new Error("@combric/cli packed executable metadata is invalid");
      if (
        entry.directory === "guard" &&
        manifest.bin?.["combric-guard"] !== "./dist/bin.js"
      )
        throw new Error("@combric/guard packed executable metadata is invalid");
      for (const required of [
        "LICENSE",
        "README.md",
        "package.json",
        ...expectedFiles[entry.directory],
      ]) {
        if (!files.includes(required))
          throw new Error(`${entry.name} tarball is missing ${required}`);
      }
      if (
        files.some(
          (file) =>
            !file.startsWith("dist/") &&
            !["LICENSE", "README.md", "package.json"].includes(file),
        )
      )
        throw new Error(`${entry.name} tarball contains an unexpected file`);
      if (
        files.some(
          (file) =>
            file.startsWith("src/") ||
            file.startsWith("test/") ||
            file.startsWith(".env"),
        )
      )
        throw new Error(`${entry.name} tarball contains an unintended file`);
      if (
        (entry.directory === "cli" || entry.directory === "guard") &&
        !(
          await readFile(join(packedRoot, "dist", "bin.js"), "utf8")
        ).startsWith("#!/usr/bin/env node")
      ) {
        throw new Error(`${entry.name} executable is missing its Node shebang`);
      }
      for (const file of files) {
        const path = join(packedRoot, file);
        if ((await stat(path)).size > 1_000_000) continue;
        const contents = await readFile(path, "utf8");
        if (secretPatterns.some((pattern) => pattern.test(contents)))
          throw new Error(
            `${entry.name} tarball contains secret-like content in ${file}`,
          );
      }
      const bytes = await readFile(tarball);
      report.packages.push({
        name: entry.name,
        directory: entry.directory,
        filename: basename(tarball),
        sha256: createHash("sha256").update(bytes).digest("hex"),
        files: files.length,
        bytes: bytes.length,
      });
    } finally {
      await rm(extraction, { recursive: true, force: true });
    }
  }
  await writeFile(
    join(output, "release-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Verified ${report.packages.length} release artifacts for ${contract.tag}.`,
  );
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
}

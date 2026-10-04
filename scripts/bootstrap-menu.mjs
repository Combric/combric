import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { loadReleaseContract } from "./lib/release-contract.mjs";
import { resolveNpmInvocation } from "./lib/npm-process.mjs";

export const BOOTSTRAP_VERSION = "0.0.0-bootstrap.0";
const packageName = "@combric/menu";
const root = fileURLToPath(new URL("../", import.meta.url));
const packageRoot = join(root, "packages", "menu");
const outputFlag = process.argv.indexOf("--output");
const requestedOutput =
  outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;

if (!requestedOutput) throw new Error("--output requires a directory");

const output = resolve(root, requestedOutput);
await mkdir(output, { recursive: true });
if ((await readdir(output)).length > 0)
  throw new Error("Bootstrap output directory must be empty");

const manifest = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8"),
);
const { contract } = await loadReleaseContract();
const contractEntry = contract.packages.find(
  ({ name }) => name === packageName,
);

if (
  !contractEntry ||
  manifest.name !== packageName ||
  manifest.private === true
)
  throw new Error(
    "@combric/menu must be public in the active release contract",
  );
if (manifest.version !== contract.version)
  throw new Error(
    `@combric/menu version must match ${contract.version} on the approved commit`,
  );

const staging = await mkdtemp(join(tmpdir(), "combric-menu-bootstrap-"));
const npmCache = await mkdtemp(join(tmpdir(), "combric-menu-bootstrap-npm-"));
try {
  await cp(join(root, "LICENSE"), join(staging, "LICENSE"));
  await cp(join(packageRoot, "README.md"), join(staging, "README.md"));
  await writeFile(
    join(staging, "package.json"),
    `${JSON.stringify(
      {
        name: packageName,
        version: BOOTSTRAP_VERSION,
        description:
          "Registry bootstrap placeholder for @combric/menu; do not install.",
        license: "MIT",
        type: "module",
        files: ["README.md"],
        repository: manifest.repository,
        publishConfig: {
          access: "public",
          provenance: false,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const npm = resolveNpmInvocation();
  const result = spawnSync(
    npm.executable,
    [
      ...npm.prefix,
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      output,
    ],
    {
      cwd: staging,
      encoding: "utf8",
      env: { ...process.env, npm_config_cache: npmCache },
      shell: npm.shell,
    },
  );
  if (result.status !== 0)
    throw new Error(
      `npm pack failed:\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );

  const packed = JSON.parse(result.stdout);
  const filename = packed[0]?.filename;
  const expectedFilename = `combric-menu-${BOOTSTRAP_VERSION}.tgz`;
  if (filename !== expectedFilename)
    throw new Error(
      `Unexpected bootstrap tarball: ${filename ?? "none"}; expected ${expectedFilename}`,
    );

  const tarball = join(output, filename);
  const bytes = await readFile(tarball);
  await writeFile(
    join(output, "bootstrap-report.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        name: packageName,
        version: BOOTSTRAP_VERSION,
        distTag: "bootstrap",
        filename,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        files: packed[0]?.files?.length ?? null,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`Prepared ${packageName}@${BOOTSTRAP_VERSION}: ${filename}`);
} finally {
  await Promise.all([
    rm(staging, { recursive: true, force: true }),
    rm(npmCache, { recursive: true, force: true }),
  ]);
}

import { createHash } from "node:crypto";
import {
  access,
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
const PACKAGE_NAME = "@combric/icons";
const root = fileURLToPath(new URL("../", import.meta.url));
const packageRoot = join(root, "packages", "icons");
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
if (manifest.name !== PACKAGE_NAME || manifest.private === true)
  throw new Error("@combric/icons must be a public package before bootstrap");
if (manifest.version !== contract.version)
  throw new Error(
    `@combric/icons version must match ${contract.version} on the approved commit`,
  );
for (const file of [
  "LICENSE",
  "README.md",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/react.d.ts",
  "dist/react.js",
  "dist/css/index.css",
  "dist/metadata.json",
]) {
  await access(join(packageRoot, file));
}

const staging = await mkdtemp(join(tmpdir(), "combric-icons-bootstrap-"));
try {
  await cp(join(packageRoot, "dist"), join(staging, "dist"), {
    recursive: true,
  });
  for (const file of ["LICENSE", "README.md"]) {
    await cp(join(packageRoot, file), join(staging, file));
  }
  await writeFile(
    join(staging, "package.json"),
    `${JSON.stringify(
      {
        ...manifest,
        version: BOOTSTRAP_VERSION,
        publishConfig: {
          ...manifest.publishConfig,
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
      shell: npm.shell,
    },
  );
  if (result.status !== 0)
    throw new Error(
      `npm pack failed:\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );

  const packed = JSON.parse(result.stdout);
  const filename = packed[0]?.filename;
  const expectedFilename = `combric-icons-${BOOTSTRAP_VERSION}.tgz`;
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
        name: PACKAGE_NAME,
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
  console.log(`Prepared ${PACKAGE_NAME}@${BOOTSTRAP_VERSION}: ${filename}`);
} finally {
  await rm(staging, { recursive: true, force: true });
}

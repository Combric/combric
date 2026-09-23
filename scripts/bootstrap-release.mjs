import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import {
  repositoryRoot,
  loadReleaseContract,
} from "./lib/release-contract.mjs";
import {
  assertBootstrapContract,
  verifyArtifactHashes,
  BOOTSTRAP_APPROVAL,
} from "./lib/bootstrap-contract.mjs";
import { runNpm } from "./lib/npm-process.mjs";

const args = process.argv.slice(2);
const publish = args[0] === "--publish";
const prepare = args[0] === "--prepare" || args.length === 0;
const approval = args[1];
const approvedSha = args[2] ?? process.env.COMBRIC_RELEASE_SHA;
const output =
  args[publish || prepare ? 1 : 0] ?? "release-bootstrap-artifacts";
if (publish && approval !== BOOTSTRAP_APPROVAL)
  throw new Error(
    `Publishing requires the exact authorization string: ${BOOTSTRAP_APPROVAL}`,
  );
if (!publish && !prepare)
  throw new Error('Use --prepare or --publish "PUBLISH APPROVED"');

const { contract } = await loadReleaseContract();
const testPublisher =
  process.env.NODE_ENV === "test" && process.env.COMBRIC_TEST_PUBLISHER === "1";
const publishDirectory = publish
  ? await mkdtemp(join(repositoryRoot, ".cache", "combric-bootstrap-"))
  : join(repositoryRoot, output);
const directory = publishDirectory;
const verificationOutput = publish
  ? relative(repositoryRoot, directory)
  : output;
if (publish) {
  const head = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (head.status !== 0 || head.stdout.trim() !== approvedSha)
    throw new Error("Publication requires COMBRIC_RELEASE_SHA to match HEAD");
}
if (!existsSync(join(directory, "release-report.json"))) {
  if (publish) await mkdir(directory, { recursive: true });
  await mkdir(directory, { recursive: true });
  if (
    spawnSync(
      process.execPath,
      ["scripts/verify-release-artifacts.mjs", "--output", verificationOutput],
      {
        cwd: repositoryRoot,
        stdio: "inherit",
        env: {
          ...process.env,
          npm_execpath: process.env.npm_execpath ?? "pnpm.cmd",
        },
      },
    ).status !== 0
  )
    throw new Error("Release artifact verification failed");
}
const report = JSON.parse(
  await readFile(join(directory, "release-report.json"), "utf8"),
);
const order = assertBootstrapContract(contract, report);
await verifyArtifactHashes(directory, report);

for (const name of order) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}`,
    { headers: { accept: "application/json" } },
  );
  if (response.ok && (await response.json()).versions?.[contract.version])
    throw new Error(
      `${name}@${contract.version} already exists; publish nothing`,
    );
  if (!response.ok && response.status !== 404)
    throw new Error(`npm registry returned ${response.status} for ${name}`);
}
console.log(
  `Bootstrap preflight passed. Publication order: ${order.join(" -> ")}`,
);
if (!publish) {
  console.log("No registry mutation performed.");
  process.exit(0);
}

const whoami = testPublisher
  ? { status: 0 }
  : runNpm(["whoami", "--registry", "https://registry.npmjs.org"], {
      cwd: repositoryRoot,
    });
if (whoami.status !== 0)
  throw new Error(
    "Authenticated npm CLI session is required; no publication was attempted",
  );
const published = [];
async function verifyPublished(name) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}`,
    { headers: { accept: "application/json" } },
  );
  if (!response.ok || !(await response.json()).versions?.[contract.version])
    throw new Error(
      `${name}@${contract.version} is not visible after publication`,
    );
}
for (const artifact of report.packages) {
  const result = testPublisher
    ? { status: 0 }
    : runNpm(
        [
          "publish",
          join(directory, artifact.filename),
          "--access",
          "public",
          "--tag",
          contract.distTag,
        ],
        { cwd: repositoryRoot },
      );
  if (result.status !== 0)
    throw new Error(
      `Stopped after ${published.length} package(s): ${published.join(", ") || "none"}`,
    );
  published.push(artifact.name);
  if (!testPublisher) await verifyPublished(artifact.name);
  console.log(`Published and verified ${artifact.name}@${contract.version}.`);
}
if (publish) await rm(directory, { recursive: true, force: true });

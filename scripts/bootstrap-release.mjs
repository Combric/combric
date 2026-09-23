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
import { bootstrapPublishArguments } from "./lib/bootstrap-publish.mjs";
import {
  reconcilePackage,
  RELEASE_STATES,
  waitForVisible,
} from "./lib/release-reconciliation.mjs";

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
assertBootstrapContract(contract, report);
await verifyArtifactHashes(directory, report);

const reconciled = testPublisher
  ? report.packages.map((artifact) => ({
      state: RELEASE_STATES.PENDING,
      artifact,
    }))
  : [];
if (!testPublisher) {
  for (const artifact of report.packages) {
    const result = await reconcilePackage({
      artifact: { ...artifact, path: join(directory, artifact.filename) },
      contract,
    });
    if (result.state === RELEASE_STATES.CONFLICT)
      throw new Error(`${artifact.name} registry conflict: ${result.reason}`);
    reconciled.push(result);
  }
}
const pending = reconciled.filter(
  ({ state }) => state === RELEASE_STATES.PENDING,
);
const verified = reconciled.filter(
  ({ state }) => state === RELEASE_STATES.VERIFIED_PUBLISHED,
);
if (verified.length)
  console.log(
    `VERIFIED_PUBLISHED / SKIP: ${verified.map(({ artifact }) => `${artifact.name}@${contract.version}`).join(", ")}`,
  );
if (pending.length)
  console.log(
    `PENDING: ${pending.map(({ artifact }) => `${artifact.name}@${contract.version}`).join(", ")}`,
  );
console.log(
  `Bootstrap preflight passed. Publication order: ${pending.map(({ artifact }) => artifact.name).join(" -> ") || "none"}`,
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
for (const { artifact } of pending) {
  const result = testPublisher
    ? { status: 0 }
    : runNpm(
        bootstrapPublishArguments(
          join(directory, artifact.filename),
          contract.distTag,
        ),
        { cwd: repositoryRoot },
      );
  if (result.status !== 0)
    throw new Error(
      `Stopped after ${published.length} package(s): ${published.join(", ") || "none"}`,
    );
  published.push(artifact.name);
  if (!testPublisher) {
    const visible = await waitForVisible({
      check: async () => {
        try {
          return (
            (
              await reconcilePackage({
                artifact: {
                  ...artifact,
                  path: join(directory, artifact.filename),
                },
                contract,
              })
            ).state === RELEASE_STATES.VERIFIED_PUBLISHED
          );
        } catch {
          return false;
        }
      },
    });
    if (!visible)
      throw new Error(
        `${artifact.name}@${contract.version} publication accepted but registry visibility was not confirmed; no republish attempted`,
      );
  }
  console.log(`Published and verified ${artifact.name}@${contract.version}.`);
}
if (publish) await rm(directory, { recursive: true, force: true });

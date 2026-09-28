import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  loadReleaseContract,
  repositoryRoot,
} from "./lib/release-contract.mjs";
import {
  reconcilePackage,
  RELEASE_STATES,
} from "./lib/release-reconciliation.mjs";
import { parseApprovedPackages } from "./lib/release-recovery.mjs";

const args = process.argv.slice(2);
const artifactDirectory = args.shift();
if (!artifactDirectory) throw new Error("Artifact directory is required");
let skipExistingValue = "";
if (args.length === 0) {
  // Normal releases publish every artifact.
} else if (args.length === 2 && args[0] === "--skip-existing") {
  skipExistingValue = args[1];
} else {
  throw new Error(
    "Usage: node scripts/publish-release.mjs <artifact-directory> [--skip-existing package,...]",
  );
}
const directory = join(repositoryRoot, artifactDirectory);
const report = JSON.parse(
  await readFile(join(directory, "release-report.json"), "utf8"),
);
const { contract } = await loadReleaseContract();
if (
  report.schemaVersion !== 1 ||
  report.version !== contract.version ||
  report.tag !== contract.tag ||
  report.distTag !== contract.distTag ||
  report.packages.length !== contract.packages.length
)
  throw new Error("Release report differs from the release contract");

const skipExisting = parseApprovedPackages(skipExistingValue, contract);

for (let index = 0; index < contract.packages.length; index += 1) {
  const expected = contract.packages[index];
  const artifact = report.packages[index];
  if (artifact.name !== expected.name)
    throw new Error("Artifact publication order is invalid");
  if (
    artifact.directory !== expected.directory ||
    artifact.filename !==
      `combric-${expected.directory}-${contract.version}.tgz` ||
    !/^[a-f0-9]{64}$/.test(artifact.sha256)
  )
    throw new Error(`${expected.name} artifact report is invalid`);
  const bytes = await readFile(join(directory, artifact.filename));
  if (createHash("sha256").update(bytes).digest("hex") !== artifact.sha256)
    throw new Error(`${artifact.name} artifact hash mismatch`);
}

for (const artifact of report.packages) {
  if (!skipExisting.has(artifact.name)) continue;
  const reconciliation = await reconcilePackage({ artifact, contract });
  if (reconciliation.state !== RELEASE_STATES.VERIFIED_PUBLISHED)
    throw new Error(
      `${artifact.name}@${contract.version} is not safe to skip: ${reconciliation.reason ?? reconciliation.state}`,
    );
  console.log(
    `Skipped already published ${artifact.name}@${contract.version} after recovery verification.`,
  );
}

const successful = [];
for (const artifact of report.packages) {
  if (skipExisting.has(artifact.name)) continue;
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(
    npm,
    [
      "publish",
      join(directory, artifact.filename),
      "--access",
      "public",
      "--provenance",
      "--tag",
      contract.distTag,
    ],
    { encoding: "utf8", stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(
      `Publication stopped at ${artifact.name}. Successfully published before failure: ${successful.length ? successful.join(", ") : "none"}`,
    );
  }
  successful.push(artifact.name);
  console.log(`Published ${artifact.name}@${contract.version}.`);
}
console.log(`Published release set: ${successful.join(", ")}`);

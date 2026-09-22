import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  loadReleaseContract,
  repositoryRoot,
} from "./lib/release-contract.mjs";

const artifactDirectory = process.argv[2];
if (!artifactDirectory) throw new Error("Artifact directory is required");
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

const successful = [];
for (const artifact of report.packages) {
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

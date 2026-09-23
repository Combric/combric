import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const BOOTSTRAP_APPROVAL = "PUBLISH APPROVED";
export const BOOTSTRAP_PACKAGES = [
  "@combric/tokens",
  "@combric/layout",
  "@combric/react",
  "@combric/tailwind",
  "@combric/cli",
  "@combric/guard",
];

export function assertBootstrapContract(contract, report) {
  if (
    contract.version !== "1.0.0" ||
    contract.tag !== "v1.0.0" ||
    contract.distTag !== "latest"
  )
    throw new Error("Bootstrap is restricted to 1.0.0/latest");
  if (
    report.version !== contract.version ||
    report.distTag !== contract.distTag
  )
    throw new Error("Artifact report does not match the bootstrap contract");
  if (
    JSON.stringify(contract.packages.map(({ name }) => name)) !==
    JSON.stringify(BOOTSTRAP_PACKAGES)
  )
    throw new Error("Bootstrap package set is not the fixed six-package set");
  if (report.packages.length !== BOOTSTRAP_PACKAGES.length)
    throw new Error("Bootstrap package set is incomplete");
  for (const [index, entry] of contract.packages.entries()) {
    const artifact = report.packages[index];
    if (
      !artifact ||
      artifact.name !== entry.name ||
      artifact.directory !== entry.directory
    )
      throw new Error("Bootstrap publication order or package set is invalid");
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256))
      throw new Error(`Invalid artifact hash for ${entry.name}`);
  }
  return contract.packages.map(({ name }) => name);
}

export async function verifyArtifactHashes(directory, report) {
  for (const artifact of report.packages) {
    const bytes = await readFile(join(directory, artifact.filename));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hash !== artifact.sha256)
      throw new Error(`Artifact hash mismatch for ${artifact.name}`);
  }
}

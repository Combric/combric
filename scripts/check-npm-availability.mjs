import { loadReleaseContract } from "./lib/release-contract.mjs";
import {
  reconcileMetadata,
  RELEASE_STATES,
} from "./lib/release-reconciliation.mjs";
import { parseApprovedPackages } from "./lib/release-recovery.mjs";

const args = process.argv.slice(2);
let approvedExistingValue = "";
if (args.length === 0) {
  // Normal releases require every target version to be absent.
} else if (args.length === 2 && args[0] === "--allow-existing") {
  approvedExistingValue = args[1];
} else {
  throw new Error(
    "Usage: node scripts/check-npm-availability.mjs [--allow-existing package,...]",
  );
}

const { contract } = await loadReleaseContract();
const approvedExisting = parseApprovedPackages(approvedExistingValue, contract);
for (const { name } of contract.packages) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}`,
    { headers: { accept: "application/json" } },
  );
  if (response.status === 404) {
    if (approvedExisting.has(name))
      throw new Error(
        `${name}@${contract.version} was approved as existing but is absent from npm`,
      );
    console.log(`${name}@${contract.version} is not present.`);
    continue;
  }
  if (!response.ok)
    throw new Error(
      `npm registry returned ${response.status} for ${name}; availability is unverified`,
    );
  const metadata = await response.json();
  if (!metadata.versions?.[contract.version]) {
    if (approvedExisting.has(name))
      throw new Error(
        `${name}@${contract.version} was approved as existing but is absent from npm`,
      );
    console.log(`${name}@${contract.version} is not present.`);
    continue;
  }
  if (!approvedExisting.has(name))
    throw new Error(`${name}@${contract.version} is already published`);
  const artifact = contract.packages.find((entry) => entry.name === name);
  const reconciliation = reconcileMetadata({ artifact, contract, metadata });
  if (reconciliation.state !== RELEASE_STATES.VERIFIED_PUBLISHED)
    throw new Error(
      `${name}@${contract.version} is not safe to resume: ${reconciliation.reason ?? reconciliation.state}`,
    );
  console.log(
    `${name}@${contract.version} is already published and verified for recovery.`,
  );
}

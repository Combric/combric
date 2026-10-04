import { loadReleaseContract } from "./lib/release-contract.mjs";
import {
  reconcilePackage,
  RELEASE_STATES,
} from "./lib/release-reconciliation.mjs";

const { contract } = await loadReleaseContract();
for (const artifact of contract.packages) {
  let reconciliation;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    reconciliation = await reconcilePackage({ artifact, contract });
    if (reconciliation.state === RELEASE_STATES.VERIFIED_PUBLISHED) break;
    if (reconciliation.state === RELEASE_STATES.CONFLICT)
      throw new Error(
        `${artifact.name}@${contract.version} has a registry conflict: ${reconciliation.reason}`,
      );
    if (attempt < 12)
      await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  if (reconciliation?.state !== RELEASE_STATES.VERIFIED_PUBLISHED)
    throw new Error(
      `${artifact.name}@${contract.version} could not be verified on npm with its ${contract.distTag} dist-tag`,
    );
  console.log(
    `Verified ${artifact.name}@${contract.version} on npm with ${contract.distTag}.`,
  );
}

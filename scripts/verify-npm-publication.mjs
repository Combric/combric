import { loadReleaseContract } from "./lib/release-contract.mjs";
import {
  reconcilePackage,
  verifyPublishedRelease,
} from "./lib/release-reconciliation.mjs";

const { contract } = await loadReleaseContract();
await verifyPublishedRelease({
  contract,
  reconcile: (artifact) => reconcilePackage({ artifact, contract }),
});

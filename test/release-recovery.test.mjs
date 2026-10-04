import assert from "node:assert/strict";
import test from "node:test";
import { loadReleaseContract } from "../scripts/lib/release-contract.mjs";
import {
  assertPackagesInContract,
  parseApprovedPackageList,
  parseApprovedPackages,
} from "../scripts/lib/release-recovery.mjs";
import {
  reconcileMetadata,
  RELEASE_STATES,
} from "../scripts/lib/release-reconciliation.mjs";

const { contract } = await loadReleaseContract();

test("recovery package lists are explicit, unique, and contract-scoped", () => {
  assert.deepEqual(
    parseApprovedPackageList(" @combric/tokens, @combric/cli "),
    ["@combric/tokens", "@combric/cli"],
  );
  assert.deepEqual(parseApprovedPackages("", contract), new Set());
  assert.throws(
    () => parseApprovedPackageList("@combric/tokens,@combric/tokens"),
    /duplicate package names/,
  );
  assert.throws(
    () => assertPackagesInContract(["@combric/unknown"], contract),
    /outside the release contract/,
  );
});

test("recovery verifies an existing target before allowing it to be skipped", () => {
  const artifact = contract.packages.find(
    ({ name }) => name === "@combric/tokens",
  );
  const metadata = {
    name: artifact.name,
    repository: { directory: "packages/tokens" },
    "dist-tags": { [contract.distTag]: contract.version },
    versions: { [contract.version]: { version: contract.version } },
  };
  assert.equal(
    reconcileMetadata({ artifact, contract, metadata }).state,
    RELEASE_STATES.VERIFIED_PUBLISHED,
  );
  assert.equal(
    reconcileMetadata({
      artifact,
      contract,
      metadata: {
        ...metadata,
        "dist-tags": { [contract.distTag]: "1.2.0" },
      },
    }).state,
    RELEASE_STATES.CONFLICT,
  );
});

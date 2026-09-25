import assert from "node:assert/strict";
import test from "node:test";
import {
  loadReleaseContract,
  validatePackedDependencies,
  validateReleaseContract,
} from "../scripts/lib/release-contract.mjs";

const { contract, manifests } = await loadReleaseContract();

test("release contract matches the six publishable packages", () => {
  assert.equal(contract.version, "1.1.0");
  assert.deepEqual(
    contract.packages.map(({ name }) => name),
    [
      "@combric/tokens",
      "@combric/layout",
      "@combric/react",
      "@combric/tailwind",
      "@combric/cli",
      "@combric/guard",
    ],
  );
  assert.doesNotThrow(() => validateReleaseContract(contract, manifests));
});

test("release contract rejects a wrong package version", () => {
  const changed = new Map(manifests);
  changed.set("@combric/react", {
    ...changed.get("@combric/react"),
    version: "1.0.1",
  });
  assert.throws(
    () => validateReleaseContract(contract, changed),
    /must have release version/,
  );
});

test("release contract rejects missing and duplicate packages", () => {
  const missing = new Map(manifests);
  missing.delete("@combric/guard");
  assert.throws(
    () => validateReleaseContract(contract, missing),
    /Missing release package/,
  );
  const duplicate = {
    ...contract,
    packages: [...contract.packages, contract.packages[0]],
  };
  assert.throws(
    () => validateReleaseContract(duplicate, manifests),
    /duplicates/,
  );
});

test("release contract rejects invalid dependency order", () => {
  const reordered = {
    ...contract,
    packages: [
      contract.packages[1],
      contract.packages[0],
      ...contract.packages.slice(2),
    ],
  };
  assert.throws(
    () => validateReleaseContract(reordered, manifests),
    /invalid dependency order/,
  );
});

test("packed manifests reject workspace and local dependency leaks", () => {
  const entry = contract.packages.find(
    ({ name }) => name === "@combric/layout",
  );
  assert.throws(
    () =>
      validatePackedDependencies(
        entry,
        { dependencies: { "@combric/tokens": "workspace:^" } },
        contract.version,
      ),
    /contains workspace/,
  );
  assert.throws(
    () =>
      validatePackedDependencies(
        entry,
        { dependencies: { "@combric/tokens": "file:../tokens" } },
        contract.version,
      ),
    /contains file/,
  );
  assert.throws(
    () =>
      validatePackedDependencies(
        entry,
        { dependencies: { "@combric/tokens": "^2.0.0" } },
        contract.version,
      ),
    /must be \^1\.1\.0/,
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { loadReleaseContract } from "../scripts/lib/release-contract.mjs";
import {
  assertBootstrapContract,
  BOOTSTRAP_APPROVAL,
} from "../scripts/lib/bootstrap-contract.mjs";

const { contract } = await loadReleaseContract();
const report = {
  version: "1.0.0",
  distTag: "latest",
  packages: contract.packages.map((entry, index) => ({
    name: entry.name,
    directory: entry.directory,
    sha256: `${index}`.padStart(64, "0"),
    filename: `${entry.directory}.tgz`,
  })),
};

test("bootstrap contract fixes version, package set, and order", () => {
  assert.deepEqual(
    assertBootstrapContract(contract, report),
    contract.packages.map(({ name }) => name),
  );
  assert.equal(BOOTSTRAP_APPROVAL, "PUBLISH APPROVED");
});

test("bootstrap rejects core or unexpected packages", () => {
  const changed = structuredClone(contract);
  changed.packages[0] = { ...changed.packages[0], name: "@combric/core" };
  assert.throws(
    () => assertBootstrapContract(changed, report),
    /fixed six-package/,
  );
});

test("bootstrap rejects incomplete or reordered artifacts", () => {
  assert.throws(
    () =>
      assertBootstrapContract(contract, {
        ...report,
        packages: report.packages.slice(0, -1),
      }),
    /incomplete/,
  );
  const reordered = { ...report, packages: [...report.packages].reverse() };
  assert.throws(() => assertBootstrapContract(contract, reordered), /order/);
});

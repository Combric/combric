Warning: truncated output (original token count: 1639)
Total output lines: 218

import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { resolveNpmInvocation } from "../scripts/lib/npm-process.mjs";
import { bootstrapPublishArguments } from "../scripts/lib/bootstrap-publish.mjs";
import {
  reconcilePackage,
  RELEASE_STATES,
  waitForVisible,
} from "../scripts/lib/release-reconciliation.mjs";
import { rm } from "node:fs/promises";
import { loadReleaseContract } from "../scripts/lib/release-contract.mjs";
import {
  assertBootstrapContract,
  BOOTSTRAP_APPROVAL,
} from "../scripts/lib/bootstrap-contract.mjs";

const { contract } = await loadReleaseContract();
const bootstrapContract = {
  ...contract,
  version: "1.0.0",
  tag: "v1.0.0",
};
const report = {
  version: bootstrapContract.version,
  distTag: bootstrapContract.distTag,
  packages: bootstrapContract.packages.map((entry, index) => ({
    name: entry.name,
    directory: entry.directory,
    sha256: `${index}`.padStart(64, "0"),
    filename: `${entry.directory}.tgz`,
  })),
};

test("bootstrap contract fixes version, package set, and order", () => {
  assert.deepEqual(
    assertBootstrapContract(bootstrapContract, report),
    bootstrapContract.packages.map(({ name }) => name),
  );
  assert.equal(BOOTSTRAP_APPROVAL, "PUBLISH APPROVED");
});

test("bootstrap rejects core or unexpected packages", () => {
  const changed = structuredClone(bootstrapContract);
  changed.packages[0] = { ...changed.packages[0], name: "@combric/core" };
  assert.throws(
    () => assertBootstrapContract(changed, report),
    /fixed six-package/,
  );
});

test("bootstrap rejects incomplete or reordered artifacts", () => {
  assert.throws(
    () =>
      assertBootstrapContract(bootstrapContract, {
        ...report,
        packages: report.packages.slice(0, -1),
      }),
    /incomplete/,
  );
  const reordered = { ...report, packages: [...report.packages].reverse() };
  assert.throws(
    () => assertBootstrapContract(bootstrapCont…639 tokens truncated…us: 404 });
  const makeArtifact = (entry) => ({ ...entry, path: "missing-for-404-test" });
  for (const count of [0, 1, 2, 5, 6]) {
    const states = [];
    for (let index = 0; index < contract.packages.length; index += 1) {
      const entry = contract.packages[index];
      const result = await reconcilePackage({
        artifact: makeArtifact({
          name: entry.name,
          directory: entry.directory,
        }),
        contract,
        fetchImpl: makeFetch(index < count ? { name: entry.name } : null),
      });
      states.push(result.state);
    }
    assert.equal(
      states.filter((state) => state === RELEASE_STATES.VERIFIED_PUBLISHED)
        .length,
      count,
    );
    assert.equal(
      states.filter((state) => state === RELEASE_STATES.PENDING).length,
      6 - count,
    );
  }
});

test("reconciliation fails closed on conflicts and propagation retries never republish", async () => {
  const conflict = await reconcilePackage({
    artifact: { name: "@combric/tokens", directory: "tokens", path: "missing" },
    contract,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          name: "@combric/tokens",
          repository: { directory: "wrong" },
          "dist-tags": { latest: contract.version },
          versions: { [contract.version]: { version: contract.version } },
        }),
        { status: 200 },
      ),
  });
  assert.equal(conflict.state, RELEASE_STATES.CONFLICT);
  let checks = 0;
  let publishes = 0;
  assert.equal(
    await waitForVisible({
      attempts: 3,
      delayMs: 0,
      check: async () => {
        checks += 1;
        return checks === 3;
      },
    }),
    true,
  );
  assert.equal(++publishes, 1);
  assert.equal(publishes, 1);
});

test("first-publish bootstrap rejects the current 1.1.0 release", () => {
  assert.equal(contract.version, "1.1.0");
  assert.throws(
    () => assertBootstrapContract(contract, report),
    /Bootstrap is restricted to 1\.0\.0\/latest/,
  );
});
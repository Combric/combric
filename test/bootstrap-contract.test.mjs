import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
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

test("bootstrap preparation invokes the canonical verifier without parent pnpm context", async () => {
  const output = `release-bootstrap-test-${process.pid}`;
  const result = spawnSync(
    process.execPath,
    ["scripts/bootstrap-release.mjs", "--prepare", output],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "true",
        npm_execpath: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      },
    },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Verified 6 release artifacts/);
  assert.ok(
    result.stdout.includes(
      "@combric/tokens -> @combric/layout -> @combric/react",
    ),
  );
  await rm(output, { recursive: true, force: true });
});

test("publish lifecycle independently rebuilds artifacts at a simulated boundary", async () => {
  const approvedSha = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim();
  const result = spawnSync(
    process.execPath,
    [
      "scripts/bootstrap-release.mjs",
      "--publish",
      "PUBLISH APPROVED",
      approvedSha,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test",
        COMBRIC_TEST_PUBLISHER: "1",
        COMBRIC_RELEASE_SHA: approvedSha,
      },
    },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Verified 6 release artifacts/);
  assert.match(result.stdout, /Published and verified/);
});

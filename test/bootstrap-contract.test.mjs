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
    () => assertBootstrapContract(bootstrapContract, reordered),
    /order/,
  );
});

test("bootstrap preparation rejects the later 1.1.0 release target", async () => {
  assert.equal(contract.version, "1.1.0");
  const output = `release-bootstrap-test-${process.pid}`;
  try {
    const result = spawnSync(
      process.execPath,
      ["scripts/bootstrap-release.mjs", "--prepare", output],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          CI: "true",
          NODE_ENV: "test",
          COMBRIC_TEST_PUBLISHER: "1",
          npm_execpath: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
        },
      },
    );
    assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /Bootstrap is restricted to 1\.0\.0\/latest/,
    );
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("npm authentication uses a Windows-safe bundled npm CLI invocation", () => {
  const invocation = resolveNpmInvocation({
    platform: "win32",
    nodePath: process.execPath,
    npmCliPath: undefined,
  });
  if (invocation.executable === process.execPath) {
    assert.equal(invocation.shell, false);
    assert.match(invocation.prefix[0], /npm-cli\.js$/i);
  } else {
    assert.equal(invocation.executable, "npm.cmd");
    assert.equal(invocation.shell, true);
  }
});

test("npm authentication resolver supports a JavaScript npm entrypoint", () => {
  const invocation = resolveNpmInvocation({
    platform: "win32",
    nodePath: process.execPath,
    npmCliPath: "C:/pnpm/npm.cjs",
  });
  assert.equal(invocation.executable, process.execPath);
  assert.deepEqual(invocation.prefix, ["C:/pnpm/npm.cjs"]);
  assert.equal(invocation.shell, false);
});

test("local bootstrap explicitly disables provenance without changing release CI", () => {
  assert.deepEqual(
    bootstrapPublishArguments(
      "release-artifacts/combric-tokens-1.0.0.tgz",
      "latest",
    ),
    [
      "publish",
      "release-artifacts/combric-tokens-1.0.0.tgz",
      "--access",
      "public",
      "--provenance=false",
      "--tag",
      "latest",
    ],
  );
});

test("reconciliation classifies 0/6, 1/6, 2/6, 5/6, and 6/6 states", async () => {
  const makeFetch = (published) => async () =>
    published
      ? new Response(
          JSON.stringify({
            name: published.name,
            "dist-tags": { latest: contract.version },
            versions: { [contract.version]: { version: contract.version } },
          }),
          { status: 200 },
        )
      : new Response("not found", { status: 404 });
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

test("first-publish bootstrap rejects the current 1.1.0 release contract", () => {
  assert.equal(contract.version, "1.1.0");
  assert.throws(
    () => assertBootstrapContract(contract, report),
    /Bootstrap is restricted to 1\.0\.0\/latest/,
  );
});

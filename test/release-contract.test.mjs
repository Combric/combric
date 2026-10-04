import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  loadReleaseContract,
  releaseMetadata,
  validatePackedDependencies,
  validateReleaseContract,
} from "../scripts/lib/release-contract.mjs";

const { contract, manifests } = await loadReleaseContract();
const releaseWorkflow = await readFile(
  new URL("../.github/workflows/release.yml", import.meta.url),
  "utf8",
);

test("release finalizer configures Git identity before creating its tag", () => {
  const tagCommand = 'git tag -a "$RELEASE_TAG"';
  const tagIndex = releaseWorkflow.indexOf(tagCommand);
  assert.notEqual(tagIndex, -1);

  for (const identityCommand of [
    'git config user.name "github-actions[bot]"',
    'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
  ]) {
    const identityIndex = releaseWorkflow.indexOf(identityCommand);
    assert.notEqual(identityIndex, -1);
    assert.ok(identityIndex < tagIndex);
  }
});

test("release contract matches the coordinated beta package set", () => {
  assert.equal(contract.version, "1.4.0-beta.0");
  assert.equal(contract.distTag, "beta");
  assert.deepEqual(
    contract.packages.map(({ name }) => name),
    [
      "@combric/tokens",
      "@combric/icons",
      "@combric/layout",
      "@combric/react",
      "@combric/menu",
      "@combric/tailwind",
      "@combric/cli",
      "@combric/guard",
    ],
  );
  assert.doesNotThrow(() => validateReleaseContract(contract, manifests));
  assert.deepEqual(releaseMetadata(contract), {
    version: "1.4.0-beta.0",
    tag: "v1.4.0-beta.0",
    distTag: "beta",
    channel: "beta",
    prerelease: true,
    artifactName: "combric-v1.4.0-beta.0",
  });
});

test("release contract rejects an invalid prerelease channel or dist-tag", () => {
  assert.throws(
    () =>
      validateReleaseContract({ ...contract, distTag: "latest" }, manifests),
    /release channel contract/,
  );
  assert.throws(
    () =>
      validateReleaseContract(
        { ...contract, version: "1.4.0-preview.0", tag: "v1.4.0-preview.0" },
        manifests,
      ),
    /alpha, beta, or rc prerelease/,
  );
});

test("release channels map alpha, beta, rc, and stable versions to their public tags", () => {
  for (const [version, distTag, channel, prerelease] of [
    ["1.4.0-alpha.0", "alpha", "alpha", true],
    ["1.4.0-beta.0", "beta", "beta", true],
    ["1.4.0-rc.0", "next", "rc", true],
    ["1.4.0", "latest", "stable", false],
  ]) {
    const candidate = {
      ...contract,
      version,
      tag: `v${version}`,
      distTag,
    };
    const candidateManifests = new Map(
      [...manifests].map(([name, manifest]) => [
        name,
        { ...manifest, version },
      ]),
    );

    assert.doesNotThrow(() =>
      validateReleaseContract(candidate, candidateManifests),
    );
    assert.deepEqual(releaseMetadata(candidate), {
      version,
      tag: `v${version}`,
      distTag,
      channel,
      prerelease,
      artifactName: `combric-v${version}`,
    });
  }
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
      contract.packages[2],
      contract.packages[1],
      contract.packages[0],
      ...contract.packages.slice(3),
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
    new RegExp(`must be \\^${contract.version.replaceAll(".", "\\.")}`),
  );
});

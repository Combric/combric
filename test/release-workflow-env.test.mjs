import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  loadReleaseContract,
  releaseMetadata,
} from "../scripts/lib/release-contract.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

test("release workflow exports its validated contract metadata", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "combric-release-workflow-"));
  const githubEnvironment = join(temporary, "github.env");
  const { contract } = await loadReleaseContract();
  const metadata = releaseMetadata(contract);

  try {
    await writeFile(githubEnvironment, "", "utf8");
    const result = spawnSync(
      process.execPath,
      [join(root, "scripts", "write-release-workflow-env.mjs")],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, GITHUB_ENV: githubEnvironment },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      await readFile(githubEnvironment, "utf8"),
      [
        `RELEASE_VERSION=${metadata.version}`,
        `RELEASE_TAG=${metadata.tag}`,
        `RELEASE_DIST_TAG=${metadata.distTag}`,
        `RELEASE_PRERELEASE=${metadata.prerelease}`,
        `RELEASE_ARTIFACT=${metadata.artifactName}`,
        "",
      ].join("\n"),
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

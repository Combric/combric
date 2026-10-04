import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/release.yml", import.meta.url),
  "utf8",
);

test("Combric Release recovery is explicitly authorized", () => {
  assert.match(workflow, /recovery_approval:/);
  assert.match(workflow, /resume_published_packages:/);
  assert.match(workflow, /RECOVERY APPROVED/);
  assert.match(workflow, /Recovery approval requires an explicit package list/);
});

test("Combric Release keeps normal preflight strict and skips only approved packages", () => {
  assert.match(workflow, /release:check-registry --allow-existing/);
  assert.match(
    workflow,
    /publish-release\.mjs release-artifacts --skip-existing/,
  );
  assert.match(workflow, /if \[ -n "\$RESUME_PUBLISHED_PACKAGES" \]/);
  assert.match(workflow, /pnpm release:check-registry\n/);
});

test("Combric Release passes the recovery package list to the publish job", () => {
  const publishJob = workflow.slice(workflow.indexOf("\n  publish:"));

  assert.match(
    publishJob,
    /env:\n\s+RESUME_PUBLISHED_PACKAGES: \$\{\{ inputs\.resume_published_packages \}\}/,
  );
});

test("Combric Release derives tags and prerelease state from the manifest", () => {
  assert.match(workflow, /write-release-workflow-env\.mjs/);
  assert.match(workflow, /refs\/tags\/\$RELEASE_TAG/);
  assert.match(workflow, /RELEASE_PRERELEASE/);
  assert.match(workflow, /--prerelease/);
  assert.doesNotMatch(workflow, /v1\.3\.1/);
});

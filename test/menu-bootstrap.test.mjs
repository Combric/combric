import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const bootstrapWorkflow = await readFile(
  new URL("../.github/workflows/bootstrap-menu.yml", import.meta.url),
  "utf8",
);

test("Menu bootstrap creates only the registry placeholder artifact", async () => {
  const output = await mkdtemp(join(tmpdir(), "combric-menu-bootstrap-test-"));
  try {
    const result = spawnSync(
      process.execPath,
      ["scripts/bootstrap-menu.mjs", "--output", output],
      { cwd: root, encoding: "utf8", timeout: 60_000 },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const report = JSON.parse(
      await readFile(join(output, "bootstrap-report.json"), "utf8"),
    );
    assert.deepEqual(
      {
        name: report.name,
        version: report.version,
        distTag: report.distTag,
        filename: report.filename,
      },
      {
        name: "@combric/menu",
        version: "0.0.0-bootstrap.0",
        distTag: "bootstrap",
        filename: "combric-menu-0.0.0-bootstrap.0.tgz",
      },
    );
    assert.match(report.sha256, /^[a-f0-9]{64}$/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("Menu bootstrap verifies registry propagation without reusing an npm cache", () => {
  const visibilityCheck = bootstrapWorkflow.slice(
    bootstrapWorkflow.indexOf("- name: Verify bootstrap package visibility"),
  );

  assert.match(visibilityCheck, /fetch\(/);
  assert.match(visibilityCheck, /metadata\["dist-tags"\]\?\.bootstrap/);
  assert.match(visibilityCheck, /for attempt in \{1\.\.30\}/);
  assert.match(visibilityCheck, /sleep 10/);
  assert.match(visibilityCheck, /after 5 minutes/);
  assert.doesNotMatch(visibilityCheck, /npm view/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/bootstrap-icons.yml", import.meta.url),
  "utf8",
);

test("icons bootstrap workflow is manually authorized and environment scoped", () => {
  assert.match(workflow, /name: Bootstrap Icons Package/);
  assert.match(workflow, /BOOTSTRAP APPROVED/);
  assert.match(workflow, /environment: npm-bootstrap/);
  assert.match(workflow, /NPM_BOOTSTRAP_TOKEN/);
  assert.doesNotMatch(workflow, /id-token:\s*write/);
});

test("icons bootstrap workflow publishes only the non-latest placeholder", () => {
  assert.match(workflow, /BOOTSTRAP_VERSION: 0\.0\.0-bootstrap\.0/);
  assert.match(
    workflow,
    /npm publish[\s\S]*--access public --tag bootstrap --provenance=false/,
  );
  assert.match(workflow, /Confirm bootstrap version is absent/);
  assert.match(workflow, /Verify bootstrap package visibility/);
});

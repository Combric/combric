import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageUrl = new URL("../packages/fonts/", import.meta.url);

test("@combric/fonts binds the approved Fontsource preset without bundling font binaries", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("package.json", packageUrl), "utf8"),
  );
  const css = await readFile(new URL("dist/index.css", packageUrl), "utf8");

  assert.deepEqual(manifest.sideEffects, ["./dist/index.css"]);
  assert.equal(manifest.dependencies["@combric/tokens"], "workspace:^");
  assert.equal(manifest.dependencies["@fontsource-variable/inter"], "5.3.0");
  assert.equal(
    manifest.dependencies["@fontsource-variable/jetbrains-mono"],
    "5.3.0",
  );
  assert.ok(css.includes('@import "@combric/tokens/css";'));
  assert.ok(css.includes('@import "@fontsource-variable/inter";'));
  assert.ok(css.includes('@import "@fontsource-variable/jetbrains-mono";'));
  assert.match(css, /"Inter Variable"/);
  assert.match(css, /"JetBrains Mono Variable"/);
  assert.doesNotMatch(css, /url\(/i);
});

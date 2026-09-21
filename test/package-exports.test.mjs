import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const packageNames = ["core", "tokens", "react", "cli", "guard"];

for (const packageName of packageNames) {
  test(`@combric/${packageName} exposes a loadable ESM entry point`, async () => {
    const packageUrl = new URL(`../packages/${packageName}/`, import.meta.url);
    const manifest = JSON.parse(
      await readFile(new URL("package.json", packageUrl), "utf8"),
    );
    const importUrl = new URL(manifest.exports["."].import, packageUrl);
    const typesUrl = new URL(manifest.exports["."].types, packageUrl);

    await access(typesUrl);
    const entryPoint = await import(importUrl);

    assert.deepEqual(Object.keys(entryPoint), []);
  });
}

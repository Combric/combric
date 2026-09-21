import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { renderFixture } from "./fixtures/react-consumer/app.mjs";

const require = createRequire(import.meta.url);
const packageUrl = new URL("../packages/react/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("package.json", packageUrl), "utf8"),
);
const css = await readFile(new URL("dist/index.css", packageUrl), "utf8");

test("React package declares its peer, token, and Tailwind-independent contract", () => {
  assert.equal(manifest.peerDependencies.react, ">=19.0.0 <20");
  assert.equal(manifest.dependencies["@combric/tokens"], "workspace:*");
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    assert.equal(
      Object.keys(manifest[field] ?? {}).some((name) =>
        name.includes("tailwind"),
      ),
      false,
    );
  }
});

test("React CSS consumes canonical variables and preserves metriq geometry", () => {
  assert.match(css, /^@import "@combric\/tokens\/css";/);
  assert.match(css, /border-radius: var\(--combric-radius\)/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  assert.doesNotMatch(css, /\b\d+(?:\.\d+)?(?:px|rem)\b/);
  assert.doesNotMatch(css, /tailwind/i);
});

test("real React consumer renders all primitives through public exports", () => {
  const markup = renderFixture();
  assert.match(markup, /class="combric-card"/);
  assert.match(markup, /class="combric-button"/);
  assert.match(markup, /class="combric-accordion"/);
  assert.match(markup, /aria-expanded="true"/);
  assert.doesNotMatch(markup, /tailwind/i);
});

test("real React consumer loads only the public CSS specifier", async () => {
  const fixtureCss = await readFile(
    new URL("fixtures/react-consumer/app.css", import.meta.url),
    "utf8",
  );
  assert.equal(fixtureCss.trim(), '@import "@combric/react/css";');
  assert.match(
    require.resolve("@combric/react/css"),
    /react[\\/]dist[\\/]index\.css$/,
  );
});

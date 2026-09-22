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

test("React package declares its peer, layout, and Tailwind-independent contract", () => {
  assert.equal(manifest.peerDependencies.react, ">=19.0.0 <20");
  assert.equal(manifest.peerDependencies["react-dom"], ">=19.0.0 <20");
  assert.equal(manifest.dependencies["@combric/layout"], "workspace:*");
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
  assert.match(css, /^@import "@combric\/layout\/css";/);
  assert.match(css, /border-radius: var\(--combric-radius\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /var\(--combric-color-invalid\)/);
  assert.match(css, /\.combric-input/);
  assert.match(css, /\.combric-tabs__trigger/);
  assert.match(css, /\.combric-avatar/);
  assert.match(css, /\.combric-pagination__link/);
  assert.match(css, /\.combric-dialog__content/);
  assert.match(css, /\.combric-dropdown-menu__content/);
  assert.match(css, /\.combric-popover__content/);
  assert.match(css, /\.combric-tooltip__content/);
  assert.match(css, /\.combric-toast-viewport/);
  assert.match(css, /\.combric-field/);
  assert.match(css, /\.combric-slider::-webkit-slider-thumb/);
  assert.match(css, /\.combric-slider::-moz-range-thumb/);
  assert.match(css, /\.combric-toggle-group/);
  assert.match(css, /\.combric-progress/);
  assert.match(css, /\.combric-collapsible/);
  assert.match(css, /\.combric-table-container/);
  assert.match(css, /var\(--combric-motion-duration-fast\)/);
  assert.match(css, /var\(--combric-z-index-modal\)/);
  assert.match(css, /var\(--combric-color-backdrop\)/);
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  assert.doesNotMatch(css, /\b\d+(?:\.\d+)?(?:px|rem)\b/);
  assert.doesNotMatch(css, /tailwind/i);
});

test("real React consumer renders all primitives through public exports", () => {
  const markup = renderFixture();
  assert.match(markup, /class="combric-card"/);
  assert.match(markup, /class="combric-button"/);
  assert.match(markup, /class="combric-accordion"/);
  assert.match(markup, /class="combric-container"/);
  assert.match(markup, /class="combric-stack"/);
  assert.match(markup, /class="combric-inline"/);
  assert.match(markup, /class="combric-grid"/);
  assert.match(markup, /class="combric-cluster"/);
  assert.match(markup, /class="combric-input"/);
  assert.match(markup, /class="combric-checkbox"/);
  assert.match(markup, /class="combric-radio-group"/);
  assert.match(markup, /class="combric-switch"/);
  assert.match(markup, /class="combric-select"/);
  assert.match(markup, /class="combric-badge"/);
  assert.match(markup, /class="combric-avatar"/);
  assert.match(markup, /role="tablist"/);
  assert.match(markup, /aria-label="Breadcrumb"/);
  assert.match(markup, /aria-label="Pagination"/);
  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /class="combric-dialog__trigger"/);
  assert.match(markup, /class="combric-dropdown-menu__trigger"/);
  assert.match(markup, /class="combric-popover__trigger"/);
  assert.match(markup, /class="combric-tooltip__trigger"/);
  assert.match(markup, /class="combric-field"/);
  assert.match(markup, /type="range"/);
  assert.match(markup, /class="combric-toggle"/);
  assert.match(markup, /class="combric-toggle-group"/);
  assert.match(markup, /class="combric-alert"/);
  assert.match(markup, /class="combric-progress"/);
  assert.match(markup, /class="combric-spinner"/);
  assert.match(markup, /class="combric-skeleton"/);
  assert.match(markup, /class="combric-empty-state"/);
  assert.match(markup, /class="combric-collapsible"/);
  assert.match(markup, /class="combric-table"/);
  assert.match(markup, /class="combric-description-list"/);
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

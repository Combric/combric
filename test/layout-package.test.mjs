import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const packageUrl = new URL("../packages/layout/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("package.json", packageUrl), "utf8"),
);
const css = await readFile(new URL("dist/index.css", packageUrl), "utf8");

test("layout package is a public framework-independent CSS boundary", () => {
  assert.equal(manifest.exports["."], "./dist/index.css");
  assert.equal(manifest.exports["./css"], "./dist/index.css");
  assert.equal(manifest.dependencies["@combric/tokens"], "workspace:^");
  const dependencies = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ];
  assert.equal(dependencies.includes("react"), false);
  assert.equal(
    dependencies.some((name) => name.includes("tailwind")),
    false,
  );
  assert.match(
    require.resolve("@combric/layout/css"),
    /layout[\\/]dist[\\/]index\.css$/,
  );
});

test("layout CSS exposes the stable class and token contract", () => {
  assert.match(css, /^@import "@combric\/tokens\/css";/);
  for (const className of [
    "combric-container",
    "combric-stack",
    "combric-inline",
    "combric-cluster",
    "combric-grid",
  ]) {
    assert.ok(css.includes(`.${className}`), `Missing .${className}`);
  }
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  assert.doesNotMatch(css, /\b\d+(?:\.\d+)?(?:px|rem)\b/);
  assert.doesNotMatch(css, /@media|order\s*:|javascript|react|tailwind/i);
});

test("Container and flow primitives use canonical widths and gaps", () => {
  assert.match(css, /max-width: var\(--combric-size-content-wide\)/);
  assert.match(css, /max-width: var\(--combric-size-content-prose\)/);
  assert.match(css, /padding-inline: var\(--combric-space-4\)/);
  assert.match(css, /\.combric-stack \{[\s\S]*flex-direction: column/);
  assert.match(css, /\.combric-inline \{[\s\S]*flex-wrap: nowrap/);
  assert.match(css, /\.combric-cluster \{[\s\S]*flex-flow: row wrap/);
  assert.match(css, /\[data-gap="16"\][\s\S]*var\(--combric-space-16\)/);
});

test("Grid supports bounded columns and intrinsic responsive sizing", () => {
  assert.match(css, /repeat\(\s*auto-fit,/);
  assert.match(css, /var\(--combric-size-layout-item-sm\)/);
  assert.match(css, /var\(--combric-size-layout-item-md\)/);
  assert.match(css, /var\(--combric-size-layout-item-lg\)/);
  for (const columns of [1, 2, 3, 4]) {
    assert.ok(css.includes(`[data-columns="${columns}"]`));
  }
  assert.equal(css.includes('[data-columns="5"]'), false);
});

test("standard CSS fixture consumes only the public layout entry", async () => {
  const fixtureCss = await readFile(
    new URL("fixtures/layout-consumer.css", import.meta.url),
    "utf8",
  );
  const fixtureHtml = await readFile(
    new URL("fixtures/layout-consumer.html", import.meta.url),
    "utf8",
  );
  assert.equal(fixtureCss.trim(), '@import "@combric/layout/css";');
  for (const className of [
    "combric-container",
    "combric-stack",
    "combric-inline",
    "combric-cluster",
    "combric-grid",
  ]) {
    assert.ok(fixtureHtml.includes(className));
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "packages", "icons", "dist");
const manifest = JSON.parse(
  await readFile(join(root, "packages", "icons", "package.json"), "utf8"),
);

test("icons expose standalone root, style, metadata, and asset exports", async () => {
  assert.equal(manifest.name, "@combric/icons");
  assert.notEqual(manifest.private, true);
  assert.equal(manifest.exports["./css"], "./dist/css/index.css");
  assert.equal(manifest.exports["./metadata.json"], "./dist/metadata.json");

  const rootIcons = await import("@combric/icons");
  const solidIcons = await import("@combric/icons/solid");
  const regularIcon = await import("@combric/icons/regular/activity");
  const metadata = await import("@combric/icons/metadata");
  const solidComponentName = `${metadata.solidIconNames[0]
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")}Icon`;

  assert.equal(typeof rootIcons.ActivityIcon, "function");
  assert.equal(typeof solidIcons[solidComponentName], "function");
  assert.equal(typeof regularIcon.ActivityIcon, "function");
  assert.equal(metadata.iconoirVersion, "7.12.1");
});

test("icons expose a decorative React component with standard SVG props", async () => {
  const icons = await import(pathToFileURL(join(dist, "index.js")));
  const markup = renderToStaticMarkup(
    icons.ActivityIcon({ className: "activity-icon", size: 20 }),
  );

  assert.match(markup, /^<svg /);
  assert.match(markup, /data-combric-icon="activity"/);
  assert.match(markup, /aria-hidden="true"/);
  assert.match(markup, /width="20"/);
  assert.match(markup, /height="20"/);
  assert.match(markup, /class="activity-icon"/);
});

test("labelled icons become accessible SVG images", async () => {
  const icons = await import(pathToFileURL(join(dist, "index.js")));
  const markup = renderToStaticMarkup(
    icons.ActivityIcon({ title: "Activity status" }),
  );

  assert.match(markup, /<title>Activity status<\/title>/);
  assert.match(markup, /role="img"/);
  assert.doesNotMatch(markup, /aria-hidden=/);
});

test("solid icons, metadata, CSS, and SVG assets are published", async () => {
  const solid = await import(pathToFileURL(join(dist, "solid.js")));
  const metadata = await import(pathToFileURL(join(dist, "metadata.js")));
  const css = await readFile(join(dist, "css", "regular.css"), "utf8");
  const svg = await readFile(
    join(dist, "svg", "regular", "activity.svg"),
    "utf8",
  );

  const solidName = metadata.solidIconNames[0];
  const componentName = `${solidName
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")}Icon`;

  assert.equal(typeof solid[componentName], "function");
  assert.equal(metadata.iconoirVersion, "7.12.1");
  assert.ok(metadata.iconNames.includes("activity"));
  assert.match(css, /\.combric-icon-activity\{/);
  assert.match(css, /mask-image:url\("data:image\/svg\+xml,/);
  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 24 24"/);
});

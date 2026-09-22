import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as reactExports from "../packages/react/dist/index.js";
import {
  primitiveTokens,
  semanticTokens,
} from "../packages/tokens/dist/index.js";
import { catalogue, layouts } from "../apps/docs/src/data/catalogue.ts";
import { playgroundEntries } from "../apps/docs/src/playground/registry.ts";
import { tailwindThemeMappings } from "./lib/tailwind-theme-mappings.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedExports = new Set(
  [...catalogue, ...layouts].flatMap((item) => item.publicExports),
);
const actualExports = new Set(Object.keys(reactExports));
assert(
  expectedExports.size === actualExports.size &&
    [...expectedExports].every((name) => actualExports.has(name)),
  `Documentation export coverage differs from @combric/react. Missing: ${[...actualExports].filter((name) => !expectedExports.has(name)).join(", ") || "none"}; nonexistent: ${[...expectedExports].filter((name) => !actualExports.has(name)).join(", ") || "none"}`,
);

const owners = new Map();
for (const item of [...catalogue, ...layouts]) {
  assert(
    !owners.has(item.route),
    `Duplicate documentation route ${item.route}`,
  );
  owners.set(item.route, item.title);
  for (const exported of item.publicExports) {
    assert(
      !owners.has(`export:${exported}`),
      `Export ${exported} has multiple documentation owners`,
    );
    owners.set(`export:${exported}`, item.title);
  }
}

for (const item of catalogue) {
  const directory = item.group
    .toLowerCase()
    .replaceAll(" & ", "-")
    .replaceAll(" ", "-");
  await access(
    join(
      root,
      "apps",
      "docs",
      "src",
      "content",
      "docs",
      "components",
      directory,
      `${item.slug}.mdx`,
    ),
  );
  for (const [alias, canonical] of Object.entries(item.aliases ?? {})) {
    assert(
      item.publicExports.includes(alias),
      `Alias ${alias} is not owned by ${item.title}`,
    );
    assert(
      item.publicExports.includes(canonical),
      `Canonical export ${canonical} is not owned by ${item.title}`,
    );
  }
}

assert(
  layouts.length === 5,
  "The five public layout primitives must be documented",
);
for (const item of layouts) {
  await access(
    join(
      root,
      "apps",
      "docs",
      "src",
      "content",
      "docs",
      "layout",
      `${item.slug}.mdx`,
    ),
  );
}

const playgroundIds = new Set(playgroundEntries.map((item) => item.id));
for (const item of catalogue.filter((candidate) => candidate.playground)) {
  assert(
    playgroundIds.has(item.slug),
    `Playground-enabled ${item.title} has no registry entry`,
  );
  await access(
    join(
      root,
      "apps",
      "docs",
      "src",
      "playground",
      "previews",
      `${item.slug}.tsx`,
    ),
  );
}
assert(
  playgroundIds.size === playgroundEntries.length,
  "Playground IDs must be unique",
);

for (const prefix of [
  "color.",
  "font.",
  "space.",
  "size.",
  "border.",
  "radius",
  "motion.",
  "z.index.",
]) {
  assert(
    [...Object.keys(primitiveTokens), ...Object.keys(semanticTokens)].some(
      (name) => name.startsWith(prefix),
    ),
    `Required token category ${prefix} is empty`,
  );
}

const mappingNames = new Set();
for (const [tailwindName, semanticName] of tailwindThemeMappings) {
  assert(
    !mappingNames.has(tailwindName),
    `Duplicate Tailwind mapping ${tailwindName}`,
  );
  mappingNames.add(tailwindName);
  assert(
    semanticName in semanticTokens,
    `Tailwind mapping references unknown semantic token ${semanticName}`,
  );
}

for (const packageName of [
  "core",
  "tokens",
  "layout",
  "react",
  "cli",
  "guard",
  "tailwind",
]) {
  const manifest = JSON.parse(
    await readFile(join(root, "packages", packageName, "package.json"), "utf8"),
  );
  const dependencies = Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  });
  assert(
    !dependencies.includes("@combric/docs"),
    `${manifest.name} must not depend on @combric/docs`,
  );
  assert(
    !dependencies.some((name) =>
      [
        "astro",
        "@astrojs/starlight",
        "@playwright/test",
        "colorjs.io",
      ].includes(name),
    ),
    `${manifest.name} contains a docs-only dependency`,
  );
}

const docsManifest = JSON.parse(
  await readFile(join(root, "apps", "docs", "package.json"), "utf8"),
);
assert(docsManifest.private === true, "@combric/docs must remain private");

const dist = join(root, "apps", "docs", "dist");
try {
  await access(dist);
  const htmlFiles = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(path);
    }
  }
  await walk(dist);
  assert(
    htmlFiles.length >= catalogue.length + layouts.length,
    "Static output is missing documented routes",
  );
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
      const href = match[1].split(/[?#]/, 1)[0];
      if (!href || href.startsWith("/_") || href.includes(".")) continue;
      const target =
        href === "/"
          ? join(dist, "index.html")
          : join(dist, href, "index.html");
      try {
        await access(target);
      } catch {
        throw new Error(`Broken internal link ${href} in ${file}`);
      }
    }
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log(
  `Validated docs: ${catalogue.length} component families, ${layouts.length} layouts, ${actualExports.size} public React exports.`,
);

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  metriq,
  primitiveCssVariableNames,
  primitiveTokens,
  semanticCssVariableNames,
  semanticTokenReferences,
  semanticTokens,
} from "../packages/tokens/dist/index.js";

const tokensPackageUrl = new URL("../packages/tokens/", import.meta.url);
const cssUrl = new URL("dist/tokens.css", tokensPackageUrl);

test("metriq primitives are complete CSS values", () => {
  assert.equal(metriq.name, "metriq");
  assert.ok(Object.keys(primitiveTokens).length > 0);

  for (const [name, value] of Object.entries(primitiveTokens)) {
    assert.equal(typeof value, "string", `${name} must be a string`);
    assert.notEqual(value.trim(), "", `${name} must not be empty`);
  }
});

test("every semantic token resolves to an existing primitive", () => {
  assert.deepEqual(metriq.semanticReferences, semanticTokenReferences);

  for (const [semanticName, primitiveName] of Object.entries(
    semanticTokenReferences,
  )) {
    assert.ok(
      Object.hasOwn(primitiveTokens, primitiveName),
      `${semanticName} references ${primitiveName}`,
    );
    assert.equal(semanticTokens[semanticName], primitiveTokens[primitiveName]);
  }
});

test("public CSS custom-property names are unique and namespaced", () => {
  const names = [
    ...Object.values(primitiveCssVariableNames),
    ...Object.values(semanticCssVariableNames),
  ];

  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.match(name, /^--combric-[a-z0-9-]+$/);
  }
});

test("required semantic roles and square geometry are stable", () => {
  const requiredSemanticTokens = [
    "color.canvas",
    "color.surface",
    "color.text",
    "color.text.muted",
    "color.border",
    "color.accent",
    "color.accent.foreground",
    "color.focus",
    "font.family.body",
    "space.4",
    "radius",
  ];

  for (const name of requiredSemanticTokens) {
    assert.ok(Object.hasOwn(semanticTokens, name), `Missing ${name}`);
  }

  assert.equal(semanticTokenReferences.radius, "radius.square");
  assert.equal(semanticTokens.radius, "0");
  assert.equal(semanticCssVariableNames.radius, "--combric-radius");
});

test("generated CSS exposes every primitive and semantic token", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /^\/\* Generated from @combric\/tokens/m);
  assert.match(css, /:root \{/);

  for (const [name, value] of Object.entries(primitiveTokens)) {
    assert.ok(
      css.includes(`${primitiveCssVariableNames[name]}: ${value};`),
      `Missing primitive CSS declaration for ${name}`,
    );
  }

  for (const [name, primitiveName] of Object.entries(semanticTokenReferences)) {
    assert.ok(
      css.includes(
        `${semanticCssVariableNames[name]}: var(${primitiveCssVariableNames[primitiveName]});`,
      ),
      `Missing semantic CSS declaration for ${name}`,
    );
  }
});

test("the CSS package export exists and matches the built artifact", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("package.json", tokensPackageUrl), "utf8"),
  );

  assert.equal(manifest.exports["./css"], "./dist/tokens.css");
  assert.equal(manifest.style, "./dist/tokens.css");
  await access(new URL(manifest.exports["./css"], tokensPackageUrl));
});

test("ordinary CSS can consume the public contract without Tailwind", async () => {
  const fixture = await readFile(
    new URL("fixtures/non-tailwind-consumer.css", import.meta.url),
    "utf8",
  );
  const css = await readFile(cssUrl, "utf8");
  const references = [
    ...fixture.matchAll(/var\((--combric-[a-z0-9-]+)\)/g),
  ].map(([, name]) => name);

  assert.ok(references.length > 0);
  for (const name of references) {
    assert.ok(css.includes(`${name}:`), `Fixture references unknown ${name}`);
  }
});

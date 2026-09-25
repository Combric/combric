import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  metriq,
  darkSemanticTokenReferences,
  darkSemanticTokens,
  lightSemanticTokenReferences,
  lightSemanticTokens,
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

test("required semantic roles and the legacy square alias remain stable", () => {
  const requiredSemanticTokens = [
    "color.canvas",
    "color.surface",
    "color.text",
    "color.text.muted",
    "color.border",
    "color.backdrop",
    "color.accent",
    "color.accent.foreground",
    "color.focus",
    "color.invalid",
    "color.primary",
    "color.primary.foreground",
    "color.primary.hover",
    "color.link",
    "color.surface.elevated",
    "color.invalid.foreground",
    "color.invalid.hover",
    "font.family.body",
    "space.4",
    "size.layout.item.sm",
    "size.layout.item.md",
    "size.layout.item.lg",
    "radius",
    "radius.button",
    "radius.card",
    "radius.checkbox",
    "radius.circle",
    "radius.control",
    "radius.overlay",
    "radius.pill",
    "radius.surface",
    "z.index.overlay",
    "z.index.modal",
    "z.index.toast",
  ];

  for (const name of requiredSemanticTokens) {
    assert.ok(Object.hasOwn(semanticTokens, name), `Missing ${name}`);
  }

  assert.equal(semanticTokenReferences.radius, "radius.square");
  assert.equal(semanticTokens.radius, "0");
  assert.equal(semanticCssVariableNames.radius, "--combric-radius");
  assert.equal(primitiveTokens["radius.md"], "0.25rem");
  assert.equal(semanticTokens["radius.button"], "0.25rem");
  assert.equal(semanticTokens["radius.card"], "0.25rem");
  assert.equal(semanticTokens["radius.checkbox"], "0.125rem");
  assert.equal(semanticTokens["radius.circle"], "9999px");
  assert.equal(semanticTokens["radius.pill"], "9999px");
  assert.ok(
    Number(semanticTokens["z.index.overlay"]) >
      Number(semanticTokens["z.index.modal"]),
  );
  assert.ok(
    Number(semanticTokens["z.index.toast"]) >
      Number(semanticTokens["z.index.overlay"]),
  );
});

test("Metriq exposes approved Light and coherent Dark semantic mappings", () => {
  assert.deepEqual(
    metriq.themes.light.semanticReferences,
    lightSemanticTokenReferences,
  );
  assert.deepEqual(
    metriq.themes.dark.semanticReferences,
    darkSemanticTokenReferences,
  );
  assert.equal(lightSemanticTokens, semanticTokens);
  assert.equal(lightSemanticTokens["color.canvas"], "#F2F0EA");
  assert.equal(lightSemanticTokens["color.primary"], "#151515");
  assert.equal(lightSemanticTokens["color.link"], "#151515");
  assert.equal(lightSemanticTokens["color.text"], "#202120");
  assert.equal(lightSemanticTokens["color.surface"], "#D8D6D0");
  assert.equal(lightSemanticTokens["color.accent"], "#E64A2E");
  assert.equal(
    lightSemanticTokens["color.surface.elevated"].toLowerCase(),
    "#ffffff",
  );
  assert.equal(darkSemanticTokens["color.canvas"], "#171816");
  assert.equal(darkSemanticTokens["color.primary"], "#F2F0EA");
  assert.equal(darkSemanticTokens["color.surface"], "#202120");
  assert.equal(darkSemanticTokens["color.surface.elevated"], "#2D302B");

  for (const theme of Object.values(metriq.themes)) {
    for (const [semanticName, primitiveName] of Object.entries(
      theme.semanticReferences,
    )) {
      assert.ok(Object.hasOwn(primitiveTokens, primitiveName), semanticName);
      assert.equal(
        theme.semantic[semanticName],
        primitiveTokens[primitiveName],
      );
    }
  }
});

test("theme text and interactive foreground mappings meet WCAG AA contrast", () => {
  function luminance(hex) {
    const channels = hex.match(/[\da-f]{2}/gi).map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function contrast(foreground, background) {
    const values = [luminance(foreground), luminance(background)].sort(
      (a, b) => b - a,
    );
    return (values[0] + 0.05) / (values[1] + 0.05);
  }

  for (const theme of Object.values(metriq.themes)) {
    assert.ok(
      contrast(theme.semantic["color.text"], theme.semantic["color.canvas"]) >=
        4.5,
    );
    assert.ok(
      contrast(theme.semantic["color.text"], theme.semantic["color.surface"]) >=
        4.5,
    );
    assert.ok(
      contrast(
        theme.semantic["color.border"],
        theme.semantic["color.canvas"],
      ) >= 3,
    );
    assert.ok(
      contrast(
        theme.semantic["color.border"],
        theme.semantic["color.surface"],
      ) >= 3,
    );
    assert.ok(
      contrast(
        theme.semantic["color.focus"],
        theme.semantic["color.surface"],
      ) >= 3,
    );
    assert.ok(
      contrast(
        theme.semantic["color.primary.foreground"],
        theme.semantic["color.primary"],
      ) >= 4.5,
    );
    assert.ok(
      contrast(
        theme.semantic["color.accent.foreground"],
        theme.semantic["color.accent"],
      ) >= 4.5,
    );
    assert.ok(
      contrast(
        theme.semantic["color.invalid.foreground"],
        theme.semantic["color.invalid"],
      ) >= 4.5,
    );
  }
});

test("generated CSS exposes every primitive and semantic token", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /^\/\* Generated from @combric\/tokens/m);
  assert.match(css, /:root \{/);
  assert.match(css, /\[data-theme="dark"\] \{/);

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

  for (const [name, primitiveName] of Object.entries(
    darkSemanticTokenReferences,
  )) {
    assert.ok(
      css.includes(
        `${semanticCssVariableNames[name]}: var(${primitiveCssVariableNames[primitiveName]});`,
      ),
      `Missing dark semantic CSS declaration for ${name}`,
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
  const overrides = [
    "--combric-radius-button",
    "--combric-radius-card",
    "--combric-color-primary",
    "--combric-color-accent",
  ];
  for (const name of overrides) {
    assert.ok(css.includes(`${name}:`), `Missing public override ${name}`);
  }
  assert.match(fixture, /--combric-color-primary: #183a55/);
  assert.match(fixture, /--combric-radius-button: 0/);
  assert.match(fixture, /\[data-theme="dark"\] \.consumer-theme/);
  for (const name of references) {
    assert.ok(css.includes(`${name}:`), `Fixture references unknown ${name}`);
  }
});

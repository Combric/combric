import { writeFile } from "node:fs/promises";

import {
  metriq,
  primitiveCssVariableNames,
  primitiveTokens,
  semanticCssVariableNames,
} from "../packages/tokens/dist/index.js";

function entriesInStableOrder(record) {
  return Object.entries(record).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function assertTokenContract() {
  const publicNames = [
    ...Object.values(primitiveCssVariableNames),
    ...Object.values(semanticCssVariableNames),
  ];

  if (new Set(publicNames).size !== publicNames.length) {
    throw new Error("Token CSS custom-property names must be unique");
  }

  for (const [tokenName, value] of Object.entries(primitiveTokens)) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Primitive token ${tokenName} must have a CSS value`);
    }
  }

  for (const [themeName, theme] of Object.entries(metriq.themes)) {
    for (const [semanticName, primitiveName] of Object.entries(
      theme.semanticReferences,
    )) {
      if (!(primitiveName in primitiveTokens)) {
        throw new Error(
          `Theme ${themeName} semantic token ${semanticName} references missing primitive ${primitiveName}`,
        );
      }
    }
  }

  for (const cssVariableName of publicNames) {
    if (!/^--combric-[a-z0-9-]+$/.test(cssVariableName)) {
      throw new Error(`Invalid public CSS custom property: ${cssVariableName}`);
    }
  }
}

assertTokenContract();

const declarations = [];

for (const [tokenName, value] of entriesInStableOrder(primitiveTokens)) {
  declarations.push(`  ${primitiveCssVariableNames[tokenName]}: ${value};`);
}

function semanticDeclarations(theme) {
  return entriesInStableOrder(theme.semanticReferences).map(
    ([semanticName, primitiveName]) =>
      `  ${semanticCssVariableNames[semanticName]}: var(${primitiveCssVariableNames[primitiveName]});`,
  );
}

const css = [
  "/* Generated from @combric/tokens typed definitions. Do not edit. */",
  '/* Metriq Light is the default; Dark is selected with [data-theme="dark"]. */',
  ":root {",
  ...declarations,
  ...semanticDeclarations(metriq.themes.light),
  "}",
  "",
  '[data-theme="dark"] {',
  ...semanticDeclarations(metriq.themes.dark),
  "}",
  "",
].join("\n");

await writeFile(
  new URL("../packages/tokens/dist/tokens.css", import.meta.url),
  css,
  "utf8",
);

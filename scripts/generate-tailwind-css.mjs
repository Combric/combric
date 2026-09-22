import { mkdir, writeFile } from "node:fs/promises";

import { semanticCssVariableNames } from "../packages/tokens/dist/index.js";
import { tailwindThemeMappings } from "./lib/tailwind-theme-mappings.mjs";

const tailwindNames = new Set();

for (const [tailwindName, semanticName] of tailwindThemeMappings) {
  if (tailwindNames.has(tailwindName)) {
    throw new Error(`Duplicate Tailwind theme variable ${tailwindName}`);
  }
  tailwindNames.add(tailwindName);

  if (!(semanticName in semanticCssVariableNames)) {
    throw new Error(`Unknown Combric semantic token ${semanticName}`);
  }
}

const declarations = tailwindThemeMappings.map(
  ([tailwindName, semanticName]) =>
    `  ${tailwindName}: var(${semanticCssVariableNames[semanticName]});`,
);

const css = [
  "/* Generated from the public @combric/tokens contract. Do not edit. */",
  '@import "@combric/tokens/css";',
  "",
  "@theme inline {",
  ...declarations,
  "}",
  "",
  "@utility border-combric {",
  "  border-width: var(--combric-border-width);",
  "  border-style: var(--combric-border-style);",
  "}",
  "",
  "@utility border-combric-strong {",
  "  border-width: var(--combric-border-width-strong);",
  "  border-style: var(--combric-border-style);",
  "}",
  "",
  "@utility z-combric-overlay {",
  "  z-index: var(--combric-z-index-overlay);",
  "}",
  "",
  "@utility z-combric-modal {",
  "  z-index: var(--combric-z-index-modal);",
  "}",
  "",
  "@utility z-combric-toast {",
  "  z-index: var(--combric-z-index-toast);",
  "}",
  "",
  "@utility grid-combric-auto-sm {",
  "  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--combric-size-layout-item-sm)), 1fr));",
  "}",
  "",
  "@utility grid-combric-auto-md {",
  "  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--combric-size-layout-item-md)), 1fr));",
  "}",
  "",
  "@utility grid-combric-auto-lg {",
  "  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--combric-size-layout-item-lg)), 1fr));",
  "}",
  "",
].join("\n");

const outputUrl = new URL("../packages/tailwind/dist/", import.meta.url);
await mkdir(outputUrl, { recursive: true });
await writeFile(new URL("index.css", outputUrl), css, "utf8");

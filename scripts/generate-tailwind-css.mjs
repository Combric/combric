import { mkdir, writeFile } from "node:fs/promises";

import { semanticCssVariableNames } from "../packages/tokens/dist/index.js";

const themeMappings = [
  ["--color-combric-canvas", "color.canvas"],
  ["--color-combric-surface", "color.surface"],
  ["--color-combric-foreground", "color.text"],
  ["--color-combric-muted-foreground", "color.text.muted"],
  ["--color-combric-border", "color.border"],
  ["--color-combric-accent", "color.accent"],
  ["--color-combric-accent-foreground", "color.accent.foreground"],
  ["--color-combric-accent-hover", "color.accent.hover"],
  ["--color-combric-focus", "color.focus"],
  ["--font-combric-body", "font.family.body"],
  ["--font-combric-code", "font.family.code"],
  ["--text-combric-small", "font.size.small"],
  ["--text-combric-body", "font.size.body"],
  ["--text-combric-body--line-height", "line.height.body"],
  ["--text-combric-heading-sm", "font.size.heading.sm"],
  ["--text-combric-heading-sm--line-height", "line.height.heading"],
  ["--text-combric-heading-md", "font.size.heading.md"],
  ["--text-combric-heading-md--line-height", "line.height.heading"],
  ["--text-combric-heading-lg", "font.size.heading.lg"],
  ["--text-combric-heading-lg--line-height", "line.height.heading"],
  ["--font-weight-combric-body", "font.weight.body"],
  ["--font-weight-combric-emphasis", "font.weight.emphasis"],
  ["--tracking-combric-heading", "letter.spacing.heading"],
  ["--leading-combric-body", "line.height.body"],
  ["--leading-combric-heading", "line.height.heading"],
  ["--spacing-combric-0", "space.0"],
  ["--spacing-combric-1", "space.1"],
  ["--spacing-combric-2", "space.2"],
  ["--spacing-combric-3", "space.3"],
  ["--spacing-combric-4", "space.4"],
  ["--spacing-combric-6", "space.6"],
  ["--spacing-combric-8", "space.8"],
  ["--spacing-combric-12", "space.12"],
  ["--spacing-combric-16", "space.16"],
  ["--spacing-combric-control-sm", "size.control.sm"],
  ["--spacing-combric-control-md", "size.control.md"],
  ["--spacing-combric-control-lg", "size.control.lg"],
  ["--container-combric-prose", "size.content.prose"],
  ["--container-combric-wide", "size.content.wide"],
  ["--radius-combric", "radius"],
];

const tailwindNames = new Set();

for (const [tailwindName, semanticName] of themeMappings) {
  if (tailwindNames.has(tailwindName)) {
    throw new Error(`Duplicate Tailwind theme variable ${tailwindName}`);
  }
  tailwindNames.add(tailwindName);

  if (!(semanticName in semanticCssVariableNames)) {
    throw new Error(`Unknown Combric semantic token ${semanticName}`);
  }
}

const declarations = themeMappings.map(
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
].join("\n");

const outputUrl = new URL("../packages/tailwind/dist/", import.meta.url);
await mkdir(outputUrl, { recursive: true });
await writeFile(new URL("index.css", outputUrl), css, "utf8");

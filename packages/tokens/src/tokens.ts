import type {
  PrimitiveTokenName,
  SemanticTokenReferences,
  SemanticTokenName,
  ThemeAwareMetriqTokenContract,
  TokenValues,
} from "./types.js";

export const primitiveTokens: TokenValues<PrimitiveTokenName> = Object.freeze({
  "border.style.solid": "solid",
  "border.width.none": "0",
  "border.width.strong": "2px",
  "border.width.thin": "1px",
  "color.blue.600": "#1d4ed8",
  "color.blue.700": "#1e40af",
  "color.palette.accent": "#E64A2E",
  "color.palette.accent.hover": "#F05D42",
  "color.palette.backdrop": "rgb(21 21 21 / 0.56)",
  "color.palette.border": "#6B6A63",
  "color.palette.canvas": "#F2F0EA",
  "color.palette.dark.accent": "#FF7A61",
  "color.palette.dark.accent.hover": "#FF9580",
  "color.palette.dark.backdrop": "rgb(0 0 0 / 0.72)",
  "color.palette.dark.border": "#7F827A",
  "color.palette.dark.canvas": "#171816",
  "color.palette.dark.invalid": "#FF8278",
  "color.palette.dark.invalid.hover": "#FF9C93",
  "color.palette.dark.muted": "#C1BFB7",
  "color.palette.dark.surface.elevated": "#2D302B",
  "color.palette.graphite": "#202120",
  "color.palette.invalid.hover": "#991B1B",
  "color.neutral.0": "#ffffff",
  "color.neutral.50": "#f7f7f5",
  "color.neutral.200": "#deded8",
  "color.neutral.400": "#a3a39a",
  "color.neutral.600": "#5c5c55",
  "color.neutral.900": "#181816",
  "color.neutral.900.translucent": "rgb(24 24 22 / 0.5)",
  "color.red.700": "#b91c1c",
  "color.palette.muted": "#55564F",
  "color.palette.primary": "#151515",
  "color.palette.surface": "#D8D6D0",
  "font.family.mono":
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  "font.family.sans":
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  "font.size.2xl": "2rem",
  "font.size.lg": "1.25rem",
  "font.size.md": "1rem",
  "font.size.sm": "0.875rem",
  "font.size.xl": "1.5rem",
  "font.size.xs": "0.75rem",
  "font.weight.bold": "700",
  "font.weight.medium": "500",
  "font.weight.regular": "400",
  "font.weight.semibold": "600",
  "letter.spacing.normal": "0",
  "letter.spacing.tight": "-0.01em",
  "line.height.body": "1.5",
  "line.height.relaxed": "1.65",
  "line.height.tight": "1.2",
  "motion.duration.fast": "800ms",
  "motion.duration.slow": "1500ms",
  "radius.full": "9999px",
  "radius.lg": "0.5rem",
  "radius.md": "0.25rem",
  "radius.square": "0",
  "radius.sm": "0.125rem",
  "size.content.prose": "42rem",
  "size.content.wide": "76rem",
  "size.control.lg": "3rem",
  "size.control.md": "2.5rem",
  "size.control.sm": "2rem",
  "size.layout.item.lg": "24rem",
  "size.layout.item.md": "20rem",
  "size.layout.item.sm": "16rem",
  "space.0": "0",
  "space.1": "0.25rem",
  "space.2": "0.5rem",
  "space.3": "0.75rem",
  "space.4": "1rem",
  "space.6": "1.5rem",
  "space.8": "2rem",
  "space.12": "3rem",
  "space.16": "4rem",
  "z.index.100": "100",
  "z.index.200": "200",
  "z.index.300": "300",
});

export const lightSemanticTokenReferences: SemanticTokenReferences =
  Object.freeze({
    "border.style": "border.style.solid",
    "border.width": "border.width.thin",
    "border.width.strong": "border.width.strong",
    "color.accent": "color.palette.accent",
    "color.accent.foreground": "color.palette.primary",
    "color.accent.hover": "color.palette.accent.hover",
    "color.backdrop": "color.palette.backdrop",
    "color.border": "color.palette.border",
    "color.canvas": "color.palette.canvas",
    "color.focus": "color.palette.primary",
    "color.invalid": "color.red.700",
    "color.invalid.foreground": "color.neutral.0",
    "color.invalid.hover": "color.palette.invalid.hover",
    "color.link": "color.palette.primary",
    "color.primary": "color.palette.primary",
    "color.primary.foreground": "color.neutral.0",
    "color.primary.hover": "color.palette.graphite",
    "color.surface": "color.palette.surface",
    "color.surface.elevated": "color.neutral.0",
    "color.text": "color.palette.graphite",
    "color.text.muted": "color.palette.muted",
    "font.family.body": "font.family.sans",
    "font.family.code": "font.family.mono",
    "font.size.body": "font.size.md",
    "font.size.heading.lg": "font.size.2xl",
    "font.size.heading.md": "font.size.xl",
    "font.size.heading.sm": "font.size.lg",
    "font.size.small": "font.size.sm",
    "font.weight.body": "font.weight.regular",
    "font.weight.emphasis": "font.weight.semibold",
    "letter.spacing.heading": "letter.spacing.tight",
    "line.height.body": "line.height.body",
    "line.height.heading": "line.height.tight",
    "motion.duration.fast": "motion.duration.fast",
    "motion.duration.slow": "motion.duration.slow",
    radius: "radius.square",
    "radius.button": "radius.md",
    "radius.card": "radius.md",
    "radius.checkbox": "radius.sm",
    "radius.circle": "radius.full",
    "radius.control": "radius.md",
    "radius.overlay": "radius.lg",
    "radius.pill": "radius.full",
    "radius.surface": "radius.md",
    "size.content.prose": "size.content.prose",
    "size.content.wide": "size.content.wide",
    "size.control.lg": "size.control.lg",
    "size.control.md": "size.control.md",
    "size.control.sm": "size.control.sm",
    "size.layout.item.lg": "size.layout.item.lg",
    "size.layout.item.md": "size.layout.item.md",
    "size.layout.item.sm": "size.layout.item.sm",
    "space.0": "space.0",
    "space.1": "space.1",
    "space.2": "space.2",
    "space.3": "space.3",
    "space.4": "space.4",
    "space.6": "space.6",
    "space.8": "space.8",
    "space.12": "space.12",
    "space.16": "space.16",
    "z.index.modal": "z.index.100",
    "z.index.overlay": "z.index.200",
    "z.index.toast": "z.index.300",
  });

export const darkSemanticTokenReferences: SemanticTokenReferences =
  Object.freeze({
    ...lightSemanticTokenReferences,
    "color.accent": "color.palette.dark.accent",
    "color.accent.foreground": "color.palette.dark.canvas",
    "color.accent.hover": "color.palette.dark.accent.hover",
    "color.backdrop": "color.palette.dark.backdrop",
    "color.border": "color.palette.dark.border",
    "color.canvas": "color.palette.dark.canvas",
    "color.focus": "color.palette.dark.accent.hover",
    "color.invalid": "color.palette.dark.invalid",
    "color.invalid.foreground": "color.palette.dark.canvas",
    "color.invalid.hover": "color.palette.dark.invalid.hover",
    "color.link": "color.palette.canvas",
    "color.primary": "color.palette.canvas",
    "color.primary.foreground": "color.palette.dark.canvas",
    "color.primary.hover": "color.palette.surface",
    "color.surface": "color.palette.graphite",
    "color.surface.elevated": "color.palette.dark.surface.elevated",
    "color.text": "color.palette.canvas",
    "color.text.muted": "color.palette.dark.muted",
  });

/** Backward-compatible alias for the default light semantic map. */
export const semanticTokenReferences: SemanticTokenReferences =
  lightSemanticTokenReferences;

function resolveSemanticTokens(
  references: SemanticTokenReferences,
): TokenValues<SemanticTokenName> {
  const resolved = {} as Record<SemanticTokenName, string>;

  for (const semanticName of Object.keys(references) as SemanticTokenName[]) {
    resolved[semanticName] = primitiveTokens[references[semanticName]];
  }

  return Object.freeze(resolved);
}

export const semanticTokens: TokenValues<SemanticTokenName> =
  resolveSemanticTokens(lightSemanticTokenReferences);

/** Explicit name for the default Light map; semanticTokens remains its legacy alias. */
export const lightSemanticTokens: TokenValues<SemanticTokenName> =
  semanticTokens;

export const darkSemanticTokens: TokenValues<SemanticTokenName> =
  resolveSemanticTokens(darkSemanticTokenReferences);

function toCssVariableName(name: string, primitive: boolean): string {
  const prefix = primitive ? "--combric-primitive-" : "--combric-";
  return `${prefix}${name.replaceAll(".", "-")}`;
}

function createCssVariableNames<Name extends string>(
  names: readonly Name[],
  primitive: boolean,
): Readonly<Record<Name, string>> {
  const cssVariables = {} as Record<Name, string>;

  for (const name of names) {
    cssVariables[name] = toCssVariableName(name, primitive);
  }

  return Object.freeze(cssVariables);
}

export const primitiveCssVariableNames: Readonly<
  Record<PrimitiveTokenName, string>
> = createCssVariableNames(
  Object.keys(primitiveTokens) as PrimitiveTokenName[],
  true,
);

export const semanticCssVariableNames: Readonly<
  Record<SemanticTokenName, string>
> = createCssVariableNames(
  Object.keys(semanticTokenReferences) as SemanticTokenName[],
  false,
);

export const metriq: ThemeAwareMetriqTokenContract = Object.freeze({
  name: "metriq",
  primitives: primitiveTokens,
  semanticReferences: lightSemanticTokenReferences,
  semantic: semanticTokens,
  themes: Object.freeze({
    light: Object.freeze({
      semanticReferences: lightSemanticTokenReferences,
      semantic: semanticTokens,
    }),
    dark: Object.freeze({
      semanticReferences: darkSemanticTokenReferences,
      semantic: darkSemanticTokens,
    }),
  }),
});

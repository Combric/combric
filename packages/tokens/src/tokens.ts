import type {
  MetriqTokenContract,
  PrimitiveTokenName,
  SemanticTokenName,
  TokenValues,
} from "./types.js";

export const primitiveTokens: TokenValues<PrimitiveTokenName> = Object.freeze({
  "border.style.solid": "solid",
  "border.width.none": "0",
  "border.width.strong": "2px",
  "border.width.thin": "1px",
  "color.blue.600": "#1d4ed8",
  "color.blue.700": "#1e40af",
  "color.neutral.0": "#ffffff",
  "color.neutral.50": "#f7f7f5",
  "color.neutral.200": "#deded8",
  "color.neutral.400": "#a3a39a",
  "color.neutral.600": "#5c5c55",
  "color.neutral.900": "#181816",
  "color.neutral.900.translucent": "rgb(24 24 22 / 0.5)",
  "color.red.700": "#b91c1c",
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
  "radius.square": "0",
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

export const semanticTokenReferences: Readonly<
  Record<SemanticTokenName, PrimitiveTokenName>
> = Object.freeze({
  "border.style": "border.style.solid",
  "border.width": "border.width.thin",
  "border.width.strong": "border.width.strong",
  "color.accent": "color.blue.600",
  "color.accent.foreground": "color.neutral.0",
  "color.accent.hover": "color.blue.700",
  "color.border": "color.neutral.200",
  "color.backdrop": "color.neutral.900.translucent",
  "color.canvas": "color.neutral.0",
  "color.focus": "color.blue.600",
  "color.invalid": "color.red.700",
  "color.surface": "color.neutral.50",
  "color.text": "color.neutral.900",
  "color.text.muted": "color.neutral.600",
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
  radius: "radius.square",
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

function resolveSemanticTokens(): TokenValues<SemanticTokenName> {
  const resolved = {} as Record<SemanticTokenName, string>;

  for (const semanticName of Object.keys(
    semanticTokenReferences,
  ) as SemanticTokenName[]) {
    resolved[semanticName] =
      primitiveTokens[semanticTokenReferences[semanticName]];
  }

  return Object.freeze(resolved);
}

export const semanticTokens: TokenValues<SemanticTokenName> =
  resolveSemanticTokens();

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

export const metriq: MetriqTokenContract = Object.freeze({
  name: "metriq",
  primitives: primitiveTokens,
  semanticReferences: semanticTokenReferences,
  semantic: semanticTokens,
});

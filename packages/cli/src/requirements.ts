import type { Mode } from "./model.js";

const OPTIONAL_CSS_IMPORTS = new Set([
  "@combric/icons/css",
  "@combric/icons/css/regular",
  "@combric/icons/css/solid",
]);

export function requiredPackages(mode: Mode): string[] {
  if (mode === "css") return ["@combric/tokens"];
  if (mode === "react") return ["@combric/react"];
  if (mode === "tailwind") return ["@combric/tailwind"];
  return ["@combric/react", "@combric/tailwind"];
}

export function requiredImports(mode: Mode): string[] {
  if (mode === "css") return ["@combric/tokens/css"];
  if (mode === "react") return ["@combric/react/css"];
  if (mode === "tailwind") return ["tailwindcss", "@combric/tailwind"];
  return ["tailwindcss", "@combric/tailwind", "@combric/react/css"];
}

export function isSupportedCssImport(mode: Mode, name: string): boolean {
  return requiredImports(mode).includes(name) || OPTIONAL_CSS_IMPORTS.has(name);
}

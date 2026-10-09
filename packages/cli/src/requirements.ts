import type { Mode } from "./model.js";

const OPTIONAL_CSS_IMPORTS = new Set([
  "@combric/icons/css",
  "@combric/icons/css/regular",
  "@combric/icons/css/solid",
]);

export function requiredPackages(mode: Mode): string[] {
  if (mode === "css") return ["@combric/tokens", "@combric/fonts"];
  if (mode === "react") return ["@combric/react", "@combric/fonts"];
  if (mode === "tailwind") return ["@combric/tailwind", "@combric/fonts"];
  return ["@combric/react", "@combric/tailwind", "@combric/fonts"];
}

export function requiredImports(mode: Mode): string[] {
  if (mode === "css") return ["@combric/tokens/css", "@combric/fonts/css"];
  if (mode === "react") return ["@combric/react/css", "@combric/fonts/css"];
  if (mode === "tailwind")
    return ["tailwindcss", "@combric/tailwind", "@combric/fonts/css"];
  return [
    "tailwindcss",
    "@combric/tailwind",
    "@combric/react/css",
    "@combric/fonts/css",
  ];
}

export function isSupportedCssImport(mode: Mode, name: string): boolean {
  return requiredImports(mode).includes(name) || OPTIONAL_CSS_IMPORTS.has(name);
}

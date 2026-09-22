import type { Mode } from "./model.js";

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

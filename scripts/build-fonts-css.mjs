import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../packages/fonts/src/index.css", import.meta.url);
const outputUrl = new URL("../packages/fonts/dist/index.css", import.meta.url);
const css = await readFile(sourceUrl, "utf8");

for (const requiredImport of [
  '@import "@combric/tokens/css";',
  '@import "@fontsource-variable/inter";',
  '@import "@fontsource-variable/jetbrains-mono";',
]) {
  if (!css.includes(requiredImport)) {
    throw new Error(
      `@combric/fonts CSS must include ${requiredImport} as a public import`,
    );
  }
}

if (
  !css.includes("--combric-primitive-font-family-sans:") ||
  !css.includes("--combric-primitive-font-family-mono:")
) {
  throw new Error("@combric/fonts must bind both public font-family stacks");
}

if (/url\(/i.test(css)) {
  throw new Error("@combric/fonts must not bundle font asset URLs");
}

await mkdir(new URL("../packages/fonts/dist/", import.meta.url), {
  recursive: true,
});
await writeFile(outputUrl, css, "utf8");

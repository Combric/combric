import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../packages/layout/src/index.css", import.meta.url);
const outputUrl = new URL("../packages/layout/dist/index.css", import.meta.url);
const css = await readFile(sourceUrl, "utf8");

if (!css.includes('@import "@combric/tokens/css";')) {
  throw new Error("@combric/layout CSS must import @combric/tokens/css");
}
if (/react|tailwind/i.test(css)) {
  throw new Error("@combric/layout must remain framework-independent");
}

await mkdir(new URL("../packages/layout/dist/", import.meta.url), {
  recursive: true,
});
await writeFile(outputUrl, css, "utf8");

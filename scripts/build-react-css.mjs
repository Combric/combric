import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceUrl = new URL("../packages/react/src/styles.css", import.meta.url);
const outputUrl = new URL("../packages/react/dist/index.css", import.meta.url);
const css = await readFile(sourceUrl, "utf8");

if (!css.includes('@import "@combric/layout/css";')) {
  throw new Error("@combric/react CSS must import @combric/layout/css");
}
if (/tailwind/i.test(css)) {
  throw new Error("@combric/react CSS must remain independent of Tailwind");
}

await mkdir(new URL("../packages/react/dist/", import.meta.url), {
  recursive: true,
});
await writeFile(outputUrl, css, "utf8");

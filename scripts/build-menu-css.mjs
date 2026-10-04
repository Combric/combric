import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = new URL("../packages/menu/src/index.css", import.meta.url);
const output = new URL("../packages/menu/dist/index.css", import.meta.url);
const css = await readFile(source, "utf8");

if (!css.includes('@import "@combric/layout/css";')) {
  throw new Error("@combric/menu CSS must import @combric/layout/css");
}

await mkdir(fileURLToPath(new URL(".", output)), { recursive: true });
await writeFile(output, css, "utf8");

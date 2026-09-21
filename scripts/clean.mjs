import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageNames = ["core", "tokens", "react", "cli", "guard"];

for (const packageName of packageNames) {
  const outputUrl = new URL(
    `../packages/${packageName}/dist/`,
    import.meta.url,
  );
  await rm(fileURLToPath(outputUrl), { force: true, recursive: true });
}

const buildCacheUrl = new URL("../.cache/tsbuild/", import.meta.url);
await rm(fileURLToPath(buildCacheUrl), { force: true, recursive: true });

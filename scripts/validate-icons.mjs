import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadReleaseContract } from "./lib/release-contract.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageRoot = join(root, "packages", "icons");
const distRoot = join(packageRoot, "dist");
const manifest = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8"),
);
const { contract } = await loadReleaseContract();

if (manifest.name !== "@combric/icons" || manifest.private === true) {
  throw new Error("@combric/icons must be publishable");
}
if (manifest.version !== contract.version) {
  throw new Error(`@combric/icons version must match ${contract.version}`);
}
if (manifest.peerDependencies?.react !== ">=19.0.0 <20") {
  throw new Error("@combric/icons must declare the React 19 peer range");
}

for (const file of [
  "index.js",
  "index.d.ts",
  "react.js",
  "react.d.ts",
  "regular.js",
  "regular.d.ts",
  "solid.js",
  "solid.d.ts",
  "metadata.js",
  "metadata.d.ts",
  "metadata.json",
  "ICONOIR-LICENSE",
  "css/index.css",
  "css/regular.css",
  "css/solid.css",
]) {
  await access(join(distRoot, file));
}

const metadata = JSON.parse(
  await readFile(join(distRoot, "metadata.json"), "utf8"),
);
if (
  metadata.source !== "Iconoir" ||
  metadata.sourceVersion !== "7.12.1" ||
  metadata.viewBox !== "0 0 24 24"
) {
  throw new Error("Icon metadata source contract is invalid");
}

for (const style of ["regular", "solid"]) {
  const files = await readdir(join(distRoot, "svg", style));
  const expected = metadata.icons.filter((icon) =>
    icon.styles.includes(style),
  ).length;
  if (files.length !== expected) {
    throw new Error(
      `${style} SVG count ${files.length} differs from metadata count ${expected}`,
    );
  }
}

const rootModule = await import(pathToFileURL(join(distRoot, "index.js")));
if (typeof rootModule.ActivityIcon !== "function") {
  throw new Error(
    "@combric/icons must expose ActivityIcon from its root entry",
  );
}

console.log(
  `Validated @combric/icons package with ${metadata.icons.length} catalog entries.`,
);

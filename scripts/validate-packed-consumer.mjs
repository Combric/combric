import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname.replace(
  /^\/(.:\/)/,
  "$1",
);
const temporary = await mkdtemp(join(tmpdir(), "combric-packed-consumer-"));
const packages = [
  "core",
  "tokens",
  "layout",
  "react",
  "cli",
  "guard",
  "tailwind",
];

function run(command, arguments_, cwd) {
  const pnpmEntry = process.env.npm_execpath;
  if (command === "pnpm" && !pnpmEntry)
    throw new Error("npm_execpath is required to locate the active pnpm CLI");
  const executable =
    command === "node" || command === "pnpm" ? process.execPath : command;
  const spawnArguments =
    command === "pnpm" ? [pnpmEntry, ...arguments_] : arguments_;
  const result = spawnSync(executable, spawnArguments, {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `${command} ${arguments_.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
  return result.stdout;
}

try {
  const dependencies = { react: "19.3.0", "react-dom": "19.3.0" };
  const overrides = [];
  for (const packageName of packages) {
    const packageDirectory = join(root, "packages", packageName);
    run("pnpm", ["pack", "--pack-destination", temporary], packageDirectory);
    dependencies[`@combric/${packageName}`] =
      `file:./combric-${packageName}-0.0.0.tgz`;
    overrides.push(
      `  '@combric/${packageName}': file:./combric-${packageName}-0.0.0.tgz`,
    );
  }
  await writeFile(
    join(temporary, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies }, null, 2),
  );
  await writeFile(
    join(temporary, "pnpm-workspace.yaml"),
    `overrides:\n${overrides.join("\n")}\n`,
    "utf8",
  );
  await writeFile(
    join(temporary, "consumer.mjs"),
    `
import { readFile } from "node:fs/promises";
import { Button } from "@combric/react";
import { metriq } from "@combric/tokens";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
if (!renderToStaticMarkup(createElement(Button, null, "Packed consumer")).includes("Packed consumer")) throw new Error("React render failed");
if (metriq.semantic.radius !== "0") throw new Error("Token contract failed");
for (const specifier of ["@combric/react/css", "@combric/layout/css", "@combric/tokens/css", "@combric/tailwind"]) {
  const resolved = import.meta.resolve(specifier);
  const contents = await readFile(new URL(resolved), "utf8");
  if (!contents.includes("combric")) throw new Error("CSS contract failed for " + specifier);
}
`,
    "utf8",
  );
  run("pnpm", ["install", "--offline", "--ignore-scripts"], temporary);
  run("node", ["consumer.mjs"], temporary);
  const manifest = JSON.parse(
    await readFile(
      join(temporary, "node_modules", "@combric", "react", "package.json"),
      "utf8",
    ),
  );
  if (
    manifest.name !== "@combric/react" ||
    manifest.exports?.["./css"] !== "./dist/index.css"
  )
    throw new Error("Packed metadata contract failed");
  console.log("Validated packed Combric consumer.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}

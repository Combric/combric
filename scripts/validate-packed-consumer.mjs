import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname.replace(
  /^\/(.:\/)/,
  "$1",
);
const temporary = await mkdtemp(join(tmpdir(), "combric-packed-consumer-"));
const packages = ["tokens", "layout", "react", "tailwind"];
const version = "1.0.0";

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
  const dependencies = {
    react: "19.3.0",
    "react-dom": "19.3.0",
    tailwindcss: "4.3.3",
    typescript: "6.0.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
  };
  const overrides = [];
  for (const packageName of packages) {
    const packageDirectory = join(root, "packages", packageName);
    run("pnpm", ["pack", "--pack-destination", temporary], packageDirectory);
    dependencies[`@combric/${packageName}`] =
      `file:./combric-${packageName}-${version}.tgz`;
    overrides.push(
      `  '@combric/${packageName}': file:./combric-${packageName}-${version}.tgz`,
    );
  }
  await writeFile(
    join(temporary, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies }, null, 2),
  );
  await writeFile(
    join(temporary, "consumer.tsx"),
    `import { Button, Card, Slider, type ButtonVariant, type CardTone, type RadiusPreset } from "@combric/react";\nimport { darkSemanticTokens, metriq, type MetriqTokenContract, type ThemeAwareMetriqTokenContract } from "@combric/tokens";\nconst variant: ButtonVariant = "accent";\nconst tone: CardTone = "elevated";\nconst radius: RadiusPreset = "none";\nconst element = <><Button variant={variant} radius={radius}>{metriq.name}</Button><Card tone={tone} radius="lg" /><Slider aria-label="Level" min={10} max={50} value={30} onChange={(event) => event.currentTarget.value} /></>;\nconst legacyContract: MetriqTokenContract = { name: "metriq", primitives: metriq.primitives, semanticReferences: metriq.semanticReferences, semantic: metriq.semantic };\nconst themeContract: ThemeAwareMetriqTokenContract = metriq;\nvoid element;\nvoid legacyContract;\nvoid themeContract.themes.dark.semantic["color.canvas"];\nvoid darkSemanticTokens["color.canvas"];\n`,
    "utf8",
  );
  await writeFile(
    join(temporary, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          jsx: "react-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          target: "ES2022",
          skipLibCheck: true,
        },
        include: ["consumer.tsx"],
      },
      null,
      2,
    ),
    "utf8",
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
import { Button, Card, Slider, Toast } from "@combric/react";
import { darkSemanticTokens, metriq } from "@combric/tokens";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const buttonMarkup = renderToStaticMarkup(createElement(Button, { radius: "none", variant: "accent" }, "Packed consumer"));
if (!buttonMarkup.includes('data-radius="none"') || !buttonMarkup.includes('data-variant="accent"')) throw new Error("Packed Button API failed");
const cardMarkup = renderToStaticMarkup(createElement(Card, { radius: "lg", tone: "elevated" }));
if (!cardMarkup.includes('data-radius="lg"') || !cardMarkup.includes('data-tone="elevated"')) throw new Error("Packed Card API failed");
const sliderMarkup = renderToStaticMarkup(createElement(Slider, { "aria-label": "Level", min: 10, max: 50, defaultValue: 30 }));
if (!sliderMarkup.includes('type="range"') || !/--combric-slider-fill:\\s*50%/.test(sliderMarkup)) throw new Error("Packed Slider contract failed");
const toastMarkup = renderToStaticMarkup(createElement(Toast, null, "Packed notice"));
if (!/<li[^>]*><div[^>]*role="status"/.test(toastMarkup) || /<li[^>]*role=/.test(toastMarkup) || /aria-live=/.test(toastMarkup)) throw new Error("Packed Toast semantics failed");
if (metriq.semantic.radius !== "0" || metriq.themes.light.semantic["color.canvas"] !== "#F2F0EA" || darkSemanticTokens["color.canvas"] !== "#171816") throw new Error("Token contract failed");
for (const specifier of ["@combric/react/css", "@combric/layout/css", "@combric/tokens/css", "@combric/tailwind"]) {
  const resolved = import.meta.resolve(specifier);
  const contents = await readFile(new URL(resolved), "utf8");
  if (!contents.includes("combric")) throw new Error("CSS contract failed for " + specifier);
  if (specifier === "@combric/tokens/css" && (!contents.includes("--combric-radius-button:") || !contents.includes('[data-theme="dark"]'))) throw new Error("Packed theme tokens failed");
  if (specifier === "@combric/react/css" && (!contents.includes("--combric-radius-card") || !contents.includes(".combric-toast__announcer") || !contents.includes("--combric-slider-fill"))) throw new Error("Packed React CSS contracts failed");
  if (specifier === "@combric/tailwind" && (!contents.includes("--radius-combric-button") || !contents.includes("--color-combric-primary"))) throw new Error("Packed Tailwind mappings failed");
}
`,
    "utf8",
  );
  run("pnpm", ["install", "--offline", "--ignore-scripts"], temporary);
  run("node", ["consumer.mjs"], temporary);
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], temporary);
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

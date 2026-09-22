import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repositoryUrl = new URL("../", import.meta.url);
const packageUrl = new URL("packages/tailwind/", repositoryUrl);
const adapterCssUrl = new URL("dist/index.css", packageUrl);
const fixtureUrl = new URL("fixtures/tailwind-consumer/", import.meta.url);

test("@combric/tailwind exposes a CSS-only public entry point", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("package.json", packageUrl), "utf8"),
  );

  assert.equal(manifest.exports["."], "./dist/index.css");
  assert.equal(manifest.style, "./dist/index.css");
  assert.deepEqual(manifest.sideEffects, ["./dist/index.css"]);
  assert.equal(manifest.dependencies["@combric/tokens"], "workspace:^");
  assert.equal(manifest.peerDependencies.tailwindcss, ">=4.3.0 <5");
});

test("adapter CSS maps Tailwind theme variables to canonical Combric variables", async () => {
  const css = await readFile(adapterCssUrl, "utf8");

  assert.ok(css.includes('@import "@combric/tokens/css";'));
  assert.ok(css.includes("@theme inline"));
  assert.ok(
    css.includes("--color-combric-surface: var(--combric-color-surface);"),
  );
  assert.ok(css.includes("--spacing-combric-4: var(--combric-space-4);"));
  assert.ok(css.includes("--radius-combric: var(--combric-radius);"));
  assert.ok(
    css.includes("--color-combric-invalid: var(--combric-color-invalid);"),
  );
  assert.ok(
    css.includes("--color-combric-backdrop: var(--combric-color-backdrop);"),
  );
  assert.ok(css.includes("@utility z-combric-overlay"));
  assert.ok(css.includes("z-index: var(--combric-z-index-overlay);"));
  assert.ok(css.includes("@utility z-combric-modal"));
  assert.ok(css.includes("z-index: var(--combric-z-index-modal);"));
  assert.ok(css.includes("@utility z-combric-toast"));
  assert.ok(css.includes("z-index: var(--combric-z-index-toast);"));
  assert.ok(
    css.includes(
      "--container-combric-item-md: var(--combric-size-layout-item-md);",
    ),
  );
  assert.ok(css.includes("@utility grid-combric-auto-md"));
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
  assert.doesNotMatch(css, /:\s*-?\d*\.?\d+(?:px|rem|em)\b/);
});

test("@combric/tokens remains independent from Tailwind", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("packages/tokens/package.json", repositoryUrl),
      "utf8",
    ),
  );
  const dependencyNames = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ];

  assert.ok(dependencyNames.every((name) => !name.includes("tailwind")));
});

test("Tailwind compiles a real Combric consumer through public package imports", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "combric-tailwind-"));
  const outputPath = join(temporaryDirectory, "output.css");
  const pnpmCli = process.env.npm_execpath;

  assert.ok(pnpmCli, "Tailwind integration tests must be invoked through pnpm");

  try {
    const result = spawnSync(
      process.execPath,
      [
        pnpmCli,
        "exec",
        "tailwindcss",
        "-i",
        fileURLToPath(new URL("input.css", fixtureUrl)),
        "-o",
        outputPath,
      ],
      {
        cwd: fileURLToPath(repositoryUrl),
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const css = await readFile(outputPath, "utf8");
    const expectedDeclarations = [
      "background-color: var(--combric-color-surface)",
      "color: var(--combric-color-text)",
      "border-color: var(--combric-color-border)",
      "border-color: var(--combric-color-invalid)",
      "background-color: var(--combric-color-backdrop)",
      "border-width: var(--combric-border-width)",
      "padding: var(--combric-space-4)",
      "border-radius: var(--combric-radius)",
      "max-width: var(--combric-size-content-prose)",
      "grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--combric-size-layout-item-md)), 1fr))",
      "z-index: var(--combric-z-index-modal)",
    ];

    for (const declaration of expectedDeclarations) {
      assert.ok(css.includes(declaration), `Missing ${declaration}`);
    }

    assert.ok(css.includes("--combric-primitive-radius-square: 0"));
    assert.ok(
      css.includes("--combric-radius: var(--combric-primitive-radius-square)"),
    );
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
});

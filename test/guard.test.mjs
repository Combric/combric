import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkProject } from "../packages/guard/dist/index.js";

const bin = fileURLToPath(
  new URL("../packages/guard/dist/bin.js", import.meta.url),
);

function run(root, args) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
  });
}

async function fixture(dependencies = { "@combric/tokens": "0.0.0" }) {
  const root = await mkdtemp(join(tmpdir(), "combric-guard-test-"));
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify(
      {
        name: "guard-consumer",
        private: true,
        packageManager: "pnpm@11.19.0",
        dependencies,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(root, "style.css"),
    '@import "@combric/tokens/css";\nbody { color: var(--combric-color-text); }\n',
  );
  return root;
}

async function snapshot(root) {
  const names = (await readdir(root)).sort();
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [
        name,
        await readFile(join(root, name), "utf8"),
      ]),
    ),
  );
}

test("healthy project has deterministic read-only typed and CLI results", async () => {
  const root = await fixture();
  try {
    const before = await snapshot(root);
    const first = await checkProject({ projectRoot: root });
    const second = await checkProject({ projectRoot: root });
    assert.deepEqual(first, second);
    assert.equal(first.schemaVersion, 1);
    assert.equal(first.projectRoot, ".");
    assert.equal(first.summary.errors, 0);
    assert.ok(first.summary.checkedFiles >= 2);
    for (const args of [[], ["check"], ["check", "--json"]]) {
      const result = run(root, args);
      assert.equal(result.status, 0, result.stderr);
      if (args.includes("--json"))
        assert.deepEqual(JSON.parse(result.stdout), first);
    }
    assert.deepEqual(await snapshot(root), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("help and metadata version work without a project; unknown arguments exit 2", async () => {
  const root = await mkdtemp(join(tmpdir(), "combric-guard-empty-"));
  try {
    assert.match(run(root, ["--help"]).stdout, /read-only, offline/);
    assert.equal(run(root, ["--version"]).stdout.trim(), "0.0.0");
    assert.equal(run(root, ["--fix"]).status, 2);
    assert.equal(run(root, ["check", "--json"]).status, 2);
    assert.equal(
      JSON.parse(run(root, ["--json"]).stdout).error.code,
      "MISSING_FILE",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("warning-only result remains successful", async () => {
  const root = await fixture({});
  try {
    await writeFile(join(root, "style.css"), "body { color: inherit; }\n");
    const result = run(root, ["check", "--json"]);
    assert.equal(result.status, 0);
    const data = JSON.parse(result.stdout);
    assert.equal(data.summary.errors, 0);
    assert.ok(
      data.diagnostics.some(
        (item) =>
          item.ruleId === "GUARD_NO_COMBRIC" && item.severity === "warning",
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("zero-config token JavaScript use does not require a CSS import; comments and strings are ignored", async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, "style.css"),
      '/* var(--combric-invalid-comment) */\nbody::before { content: "var(--combric-invalid-string)"; }\n',
    );
    const result = JSON.parse(run(root, ["--json"]).stdout);
    assert.equal(result.summary.errors, 0);
    assert.ok(
      !result.diagnostics.some(
        (item) =>
          item.ruleId === "GUARD_CSS_IMPORT" ||
          item.ruleId === "GUARD_TOKEN_UNKNOWN",
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unknown token and unsupported CSS entry produce located stable errors", async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, "combric.config.json"),
      `${JSON.stringify({ schemaVersion: 1, packageManager: "pnpm", mode: "css", cssFile: "style.css" })}\n`,
    );
    await writeFile(
      join(root, "style.css"),
      '@import "@combric/tokens/internal";\nbody { color: var(--combric-color-invented); }\n',
    );
    const result = run(root, ["check", "--json"]);
    assert.equal(result.status, 1);
    const data = JSON.parse(result.stdout);
    const entries = data.diagnostics.filter(
      (item) => item.severity === "error",
    );
    assert.ok(
      entries.some(
        (item) =>
          item.ruleId === "GUARD_CSS_ENTRY" &&
          item.file === "style.css" &&
          item.line === 1,
      ),
    );
    assert.ok(
      entries.some(
        (item) => item.ruleId === "GUARD_TOKEN_UNKNOWN" && item.line === 2,
      ),
    );
    assert.ok(entries.some((item) => item.ruleId === "GUARD_CSS_IMPORT"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("config mode checks package, Tailwind order and version without imposing Tailwind on CSS consumers", async () => {
  const root = await fixture({
    "@combric/tailwind": "0.0.0",
    tailwindcss: "^4.3.3",
  });
  try {
    await writeFile(
      join(root, "combric.config.json"),
      `${JSON.stringify({ schemaVersion: 1, packageManager: "pnpm", mode: "tailwind", cssFile: "style.css" })}\n`,
    );
    await writeFile(
      join(root, "style.css"),
      '@import "@combric/tailwind";\n@import "tailwindcss";\n',
    );
    const first = JSON.parse(run(root, ["check", "--json"]).stdout);
    assert.ok(
      first.diagnostics.some((item) => item.ruleId === "GUARD_TAILWIND_IMPORT"),
    );
    await writeFile(
      join(root, "style.css"),
      '@import "tailwindcss";\n@import "@combric/tailwind";\n',
    );
    assert.equal(run(root, ["check"]).status, 0);
    const manifest = JSON.parse(
      await readFile(join(root, "package.json"), "utf8"),
    );
    manifest.dependencies.tailwindcss = "^3.4.0";
    await writeFile(
      join(root, "package.json"),
      `${JSON.stringify(manifest)}\n`,
    );
    assert.ok(
      JSON.parse(run(root, ["check", "--json"]).stdout).diagnostics.some(
        (item) => item.ruleId === "GUARD_TAILWIND_VERSION",
      ),
    );
    manifest.dependencies.tailwindcss = "workspace:*";
    await writeFile(
      join(root, "package.json"),
      `${JSON.stringify(manifest)}\n`,
    );
    const opaque = run(root, ["check", "--json"]);
    assert.equal(opaque.status, 0);
    assert.ok(
      JSON.parse(opaque.stdout).diagnostics.some(
        (item) =>
          item.ruleId === "GUARD_TAILWIND_VERSION_UNKNOWN" &&
          item.severity === "warning",
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("malformed config is a rule violation; malformed manifest and unsafe configured path are operational", async () => {
  const root = await fixture();
  try {
    await writeFile(join(root, "combric.config.json"), "{broken");
    assert.equal(run(root, ["--json"]).status, 1);
    assert.ok(
      JSON.parse(run(root, ["--json"]).stdout).diagnostics.some(
        (item) => item.ruleId === "GUARD_CONFIG_SCHEMA",
      ),
    );
    await writeFile(
      join(root, "combric.config.json"),
      `${JSON.stringify({ schemaVersion: 1, packageManager: "pnpm", mode: "css", cssFile: "../outside.css" })}\n`,
    );
    const unsafe = run(root, ["--json"]);
    assert.equal(unsafe.status, 2);
    assert.equal(JSON.parse(unsafe.stdout).error.code, "UNSAFE_PATH");
    await writeFile(join(root, "package.json"), "not json");
    const invalid = run(root, ["--json"]);
    assert.equal(invalid.status, 2);
    assert.equal(JSON.parse(invalid.stdout).error.code, "INVALID_MANIFEST");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an explicit safe config CSS entry is checked under an excluded generated directory", async () => {
  const root = await fixture();
  try {
    await mkdir(join(root, "dist"));
    await writeFile(
      join(root, "dist", "style.css"),
      '@import "@combric/tokens/css";\n',
    );
    await writeFile(
      join(root, "combric.config.json"),
      `${JSON.stringify({ schemaVersion: 1, packageManager: "pnpm", mode: "css", cssFile: "dist/style.css" })}\n`,
    );
    const result = JSON.parse(run(root, ["--json"]).stdout);
    assert.equal(result.summary.errors, 0);
    assert.ok(result.summary.checkedFiles >= 4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("oversized CSS fails operationally instead of being treated as a healthy scan", async () => {
  const root = await fixture();
  try {
    await writeFile(join(root, "style.css"), "x".repeat(1024 * 1024 + 1));
    const result = run(root, ["--json"]);
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).error.code, "FILE_TOO_LARGE");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("symlinked consumer CSS is never followed", async (t) => {
  const root = await fixture({});
  const outside = await mkdtemp(join(tmpdir(), "combric-guard-outside-"));
  try {
    await writeFile(join(outside, "outside.css"), "body { color: red }\n");
    try {
      await symlink(join(outside, "outside.css"), join(root, "linked.css"));
    } catch (error) {
      if (["EPERM", "EACCES"].includes(error.code)) {
        t.diagnostic(
          "Windows symlink permission unavailable; path traversal is tested separately.",
        );
        return;
      }
      throw error;
    }
    const result = JSON.parse(run(root, ["--json"]).stdout);
    assert.ok(
      result.diagnostics.some(
        (item) =>
          item.ruleId === "GUARD_SYMLINK_SKIPPED" && item.file === "linked.css",
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

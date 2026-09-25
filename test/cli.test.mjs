import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const bin = fileURLToPath(
  new URL("../packages/cli/dist/bin.js", import.meta.url),
);

function run(cwd, args, env = {}) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 10_000,
  });
}

async function fixture(dependencies = {}, manager = "pnpm") {
  const root = await mkdtemp(join(tmpdir(), "combric-cli-test-"));
  const manifest = {
    name: "consumer",
    private: true,
    type: "module",
    ...(manager ? { packageManager: `${manager}@11.0.0` } : {}),
    dependencies,
  };
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(join(root, "style.css"), "body { color: inherit; }\n");
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

test("help, version, command help and unknown command have stable exits", () => {
  const help = run(process.cwd(), ["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /optional setup/);
  for (const command of ["init", "doctor", "info"]) {
    const result = run(process.cwd(), [command, "--help"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, new RegExp(`combric ${command}`));
  }
  assert.equal(run(process.cwd(), ["--version"]).stdout.trim(), "1.1.0");
  const unknown = run(process.cwd(), ["add", "button"]);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown command/);
});

test("info and doctor inspect without changing a plain project", async () => {
  const root = await fixture();
  try {
    const before = await snapshot(root);
    const info = run(root, ["info", "--json"]);
    assert.equal(info.status, 0);
    const facts = JSON.parse(info.stdout);
    assert.equal(facts.packageManager, "pnpm");
    assert.equal(facts.react, null);
    assert.equal(run(root, ["info"]).status, 0);
    const doctor = run(root, ["doctor", "--json"]);
    assert.equal(doctor.status, 0);
    assert.equal(JSON.parse(doctor.stdout).status, "ok");
    assert.deepEqual(await snapshot(root), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("project root walks upward and package-manager evidence covers npm, yarn and bun", async () => {
  for (const [manager, lockfile] of [
    ["npm", "package-lock.json"],
    ["yarn", "yarn.lock"],
    ["bun", "bun.lock"],
  ]) {
    const root = await fixture({}, null);
    try {
      await writeFile(join(root, lockfile), "lock evidence\n");
      await mkdir(join(root, "nested"));
      const result = run(join(root, "nested"), ["info", "--json"]);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(JSON.parse(result.stdout).packageManager, manager);
      assert.equal(JSON.parse(result.stdout).projectRoot, root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("dry run has zero mutations and matches applied CSS plan; second init is idempotent", async () => {
  const root = await fixture({ "@combric/tokens": "file:./tokens.tgz" });
  try {
    const args = ["init", "--mode", "css", "--css-file", "style.css"];
    const before = await snapshot(root);
    const dry = run(root, [...args, "--dry-run", "--json"]);
    assert.equal(dry.status, 0);
    const plan = JSON.parse(dry.stdout);
    assert.deepEqual(
      plan.actions.map((item) => item.type),
      ["update-css", "create-config"],
    );
    assert.deepEqual(await snapshot(root), before);
    assert.equal(run(root, args).status, 1);
    assert.deepEqual(await snapshot(root), before);
    const applied = run(root, [...args, "--yes", "--json"]);
    assert.equal(applied.status, 0, applied.stderr);
    assert.deepEqual(JSON.parse(applied.stdout).actions, plan.actions);
    assert.match(
      await readFile(join(root, "style.css"), "utf8"),
      /@combric\/tokens\/css/,
    );
    assert.equal(
      JSON.parse(await readFile(join(root, "combric.config.json"), "utf8"))
        .schemaVersion,
      1,
    );
    const stable = await snapshot(root);
    const again = run(root, ["init", "--yes", "--json"]);
    assert.equal(again.status, 0, again.stderr);
    assert.deepEqual(JSON.parse(again.stdout).actions, []);
    assert.deepEqual(await snapshot(root), stable);
    const diagnosed = JSON.parse(run(root, ["doctor", "--json"]).stdout);
    assert.equal(diagnosed.status, "ok");
    assert.ok(
      diagnosed.checks.some((item) => item.code === "PACKAGE_NOT_INSTALLED"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("React and React+Tailwind modes use their public CSS entries", async () => {
  for (const mode of ["react", "react-tailwind"]) {
    const deps = {
      "@combric/react": "file:./react.tgz",
      react: "19.3.0",
      "react-dom": "19.3.0",
      ...(mode === "react-tailwind"
        ? { tailwindcss: "4.3.3", "@combric/tailwind": "file:./tailwind.tgz" }
        : {}),
    };
    const root = await fixture(deps);
    try {
      const result = run(root, [
        "init",
        "--mode",
        mode,
        "--css-file",
        "style.css",
        "--yes",
      ]);
      assert.equal(result.status, 0, result.stderr);
      const css = await readFile(join(root, "style.css"), "utf8");
      assert.match(css, /@combric\/react\/css/);
      if (mode === "react-tailwind") {
        assert.match(css, /@import "tailwindcss"/);
        assert.match(css, /@import "@combric\/tailwind"/);
      }
      assert.equal(run(root, ["doctor"]).status, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("Tailwind-only mode, incompatible Tailwind, and CSS conflicts are conservative", async () => {
  const root = await fixture({
    "@combric/tailwind": "file:./tailwind.tgz",
    tailwindcss: "4.3.3",
  });
  try {
    assert.equal(
      run(root, [
        "init",
        "--mode",
        "tailwind",
        "--css-file",
        "style.css",
        "--yes",
      ]).status,
      0,
    );
    const css = await readFile(join(root, "style.css"), "utf8");
    assert.match(css, /@combric\/tailwind/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  const old = await fixture({ tailwindcss: "3.4.0" });
  try {
    assert.equal(
      run(old, [
        "init",
        "--mode",
        "tailwind",
        "--css-file",
        "style.css",
        "--yes",
      ]).status,
      1,
    );
    await writeFile(join(old, "style.css"), '@import "@combric/react/css";\n');
    const conflict = run(old, [
      "init",
      "--mode",
      "css",
      "--css-file",
      "style.css",
      "--dry-run",
    ]);
    assert.equal(conflict.status, 1);
    assert.match(conflict.stderr, /conflict/);
  } finally {
    await rm(old, { recursive: true, force: true });
  }
});

test("CSS import detection ignores comments and retains unrelated CSS", async () => {
  const root = await fixture({ "@combric/tokens": "file:./tokens.tgz" });
  try {
    await writeFile(
      join(root, "style.css"),
      '/* @import "@combric/tokens/css"; */\nbody { color: blue; }\n',
    );
    assert.equal(
      run(root, ["init", "--mode", "css", "--css-file", "style.css", "--yes"])
        .status,
      0,
    );
    const css = await readFile(join(root, "style.css"), "utf8");
    assert.match(css, /^@import "@combric\/tokens\/css";/);
    assert.match(css, /body \{ color: blue; \}/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ambiguous managers, missing evidence, invalid schema and unsafe path fail safely", async () => {
  const root = await fixture({}, null);
  try {
    assert.equal(
      run(root, [
        "init",
        "--mode",
        "css",
        "--css-file",
        "style.css",
        "--dry-run",
      ]).status,
      1,
    );
    assert.equal(
      run(root, [
        "init",
        "--mode",
        "css",
        "--css-file",
        "style.css",
        "--package-manager",
        "npm",
        "--dry-run",
      ]).status,
      0,
    );
    await writeFile(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await writeFile(join(root, "package-lock.json"), "{}\n");
    assert.equal(
      run(root, [
        "init",
        "--mode",
        "css",
        "--css-file",
        "style.css",
        "--dry-run",
      ]).status,
      1,
    );
    await rm(join(root, "pnpm-lock.yaml"));
    await rm(join(root, "package-lock.json"));
    await writeFile(
      join(root, "combric.config.json"),
      '{"schemaVersion":2,"packageManager":"npm","mode":"css","cssFile":"style.css"}\n',
    );
    const invalid = run(root, ["doctor", "--json"]);
    assert.equal(invalid.status, 1);
    assert.equal(JSON.parse(invalid.stdout).status, "error");
    await rm(join(root, "combric.config.json"));
    assert.equal(
      run(root, [
        "init",
        "--mode",
        "css",
        "--css-file",
        "../outside.css",
        "--package-manager",
        "npm",
        "--dry-run",
      ]).status,
      1,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workspace root with missing packages does not guess an install scope", async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, "pnpm-workspace.yaml"),
      'packages:\n  - "packages/*"\n',
    );
    const before = await snapshot(root);
    const result = run(root, [
      "init",
      "--mode",
      "css",
      "--css-file",
      "style.css",
      "--dry-run",
    ]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /workspace root/);
    assert.deepEqual(await snapshot(root), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("workspace member inherits manager evidence but remains the selected project", async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, "pnpm-workspace.yaml"),
      'packages:\n  - "packages/*"\n',
    );
    const member = join(root, "packages", "app");
    await mkdir(member, { recursive: true });
    await writeFile(
      join(member, "package.json"),
      '{"name":"member","private":true}\n',
    );
    await writeFile(join(member, "style.css"), "body {}\n");
    const info = JSON.parse(run(member, ["info", "--json"]).stdout);
    assert.equal(info.projectRoot, member);
    assert.equal(info.workspaceRoot, root);
    assert.equal(info.packageManager, "pnpm");
    const plan = run(member, [
      "init",
      "--mode",
      "css",
      "--css-file",
      "style.css",
      "--dry-run",
      "--json",
    ]);
    assert.equal(plan.status, 0, plan.stderr);
    assert.equal(JSON.parse(plan.stdout).actions[0].type, "install");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("package-manager boundary succeeds with fixture install and reports failed install without CSS changes", async () => {
  for (const succeeds of [true, false]) {
    const root = await fixture();
    try {
      const mock = join(root, "pnpm-mock.cjs");
      await writeFile(
        mock,
        succeeds
          ? 'const fs=require("node:fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));p.dependencies["@combric/tokens"]="file:./tokens.tgz";fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\\n");\n'
          : 'process.stderr.write("registry package unavailable\\n");process.exitCode=42;\n',
      );
      const beforeCss = await readFile(join(root, "style.css"), "utf8");
      const result = run(
        root,
        ["init", "--mode", "css", "--css-file", "style.css", "--yes"],
        { npm_execpath: mock },
      );
      if (succeeds) {
        assert.equal(result.status, 0, result.stderr);
        assert.match(
          await readFile(join(root, "style.css"), "utf8"),
          /@combric\/tokens\/css/,
        );
      } else {
        assert.equal(result.status, 2);
        assert.match(result.stderr, /unreleased/);
        assert.equal(
          await readFile(join(root, "style.css"), "utf8"),
          beforeCss,
        );
        assert.ok(!(await readdir(root)).includes("combric.config.json"));
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

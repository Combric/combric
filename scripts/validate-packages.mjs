import { access, readFile } from "node:fs/promises";

const packages = new Map([
  ["core", "@combric/core"],
  ["tokens", "@combric/tokens"],
  ["react", "@combric/react"],
  ["cli", "@combric/cli"],
  ["guard", "@combric/guard"],
]);

const allowedInternalDependencies = new Map([
  ["@combric/core", new Set()],
  ["@combric/tokens", new Set()],
  ["@combric/react", new Set(["@combric/core", "@combric/tokens"])],
  ["@combric/cli", new Set(["@combric/core", "@combric/tokens"])],
  ["@combric/guard", new Set(["@combric/core", "@combric/tokens"])],
]);

const manifests = new Map();

for (const [directory, expectedName] of packages) {
  const packageUrl = new URL(`../packages/${directory}/`, import.meta.url);
  const manifestUrl = new URL("package.json", packageUrl);
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  if (manifest.name !== expectedName) {
    throw new Error(`${directory} must be named ${expectedName}`);
  }
  if (manifest.private === true) {
    throw new Error(`${expectedName} must remain publishable`);
  }
  if (manifest.type !== "module" || manifest.license !== "MIT") {
    throw new Error(`${expectedName} must be an MIT-licensed ESM package`);
  }
  if (
    manifest.exports?.["."]?.types !== "./dist/index.d.ts" ||
    manifest.exports?.["."]?.import !== "./dist/index.js"
  ) {
    throw new Error(`${expectedName} has an invalid root export contract`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("dist")) {
    throw new Error(`${expectedName} must publish only its declared files`);
  }

  await access(new URL("dist/index.js", packageUrl));
  await access(new URL("dist/index.d.ts", packageUrl));
  manifests.set(expectedName, manifest);
}

const graph = new Map();
const dependencyFields = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
];

for (const [packageName, manifest] of manifests) {
  const dependencies = new Set();
  for (const field of dependencyFields) {
    for (const dependency of Object.keys(manifest[field] ?? {})) {
      if (dependency.startsWith("@combric/")) {
        dependencies.add(dependency);
      }
    }
  }

  const allowed = allowedInternalDependencies.get(packageName);
  for (const dependency of dependencies) {
    if (!allowed?.has(dependency)) {
      throw new Error(`${packageName} must not depend on ${dependency}`);
    }
  }

  graph.set(packageName, dependencies);
}

for (const packageName of ["@combric/core", "@combric/tokens"]) {
  const manifest = manifests.get(packageName);
  const externalDependencies = dependencyFields.flatMap((field) =>
    Object.keys(manifest[field] ?? {}),
  );
  if (externalDependencies.includes("react")) {
    throw new Error(`${packageName} must not depend on React`);
  }
  if (externalDependencies.some((name) => name.includes("tailwind"))) {
    throw new Error(`${packageName} must not depend on Tailwind`);
  }
}

function visit(packageName, visiting = new Set(), visited = new Set()) {
  if (visiting.has(packageName)) {
    throw new Error(`Dependency cycle detected at ${packageName}`);
  }
  if (visited.has(packageName)) {
    return;
  }

  visiting.add(packageName);
  for (const dependency of graph.get(packageName) ?? []) {
    visit(dependency, visiting, visited);
  }
  visiting.delete(packageName);
  visited.add(packageName);
}

for (const packageName of graph.keys()) {
  visit(packageName);
}

console.log(`Validated ${manifests.size} package contracts.`);

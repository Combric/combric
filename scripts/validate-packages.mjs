import { access, readFile } from "node:fs/promises";

const packages = new Map([
  ["core", "@combric/core"],
  ["tokens", "@combric/tokens"],
  ["layout", "@combric/layout"],
  ["react", "@combric/react"],
  ["cli", "@combric/cli"],
  ["guard", "@combric/guard"],
  ["tailwind", "@combric/tailwind"],
]);

const allowedInternalDependencies = new Map([
  ["@combric/core", new Set()],
  ["@combric/tokens", new Set()],
  ["@combric/layout", new Set(["@combric/tokens"])],
  ["@combric/react", new Set(["@combric/core", "@combric/layout"])],
  ["@combric/cli", new Set(["@combric/core", "@combric/tokens"])],
  ["@combric/guard", new Set(["@combric/core", "@combric/tokens"])],
  ["@combric/tailwind", new Set(["@combric/tokens"])],
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
    expectedName === "@combric/layout" ||
    expectedName === "@combric/tailwind"
  ) {
    if (
      manifest.exports?.["."] !== "./dist/index.css" ||
      manifest.style !== "./dist/index.css" ||
      !manifest.sideEffects?.includes("./dist/index.css")
    ) {
      throw new Error(`${expectedName} has an invalid CSS export contract`);
    }
  } else if (
    manifest.exports?.["."]?.types !== "./dist/index.d.ts" ||
    manifest.exports?.["."]?.import !== "./dist/index.js"
  ) {
    throw new Error(`${expectedName} has an invalid root export contract`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("dist")) {
    throw new Error(`${expectedName} must publish only its declared files`);
  }

  if (
    expectedName === "@combric/layout" ||
    expectedName === "@combric/tailwind"
  ) {
    await access(new URL("dist/index.css", packageUrl));
  } else {
    await access(new URL("dist/index.js", packageUrl));
    await access(new URL("dist/index.d.ts", packageUrl));
  }

  if (expectedName === "@combric/tokens") {
    if (manifest.exports?.["./css"] !== "./dist/tokens.css") {
      throw new Error("@combric/tokens must expose its public CSS entry point");
    }
    if (manifest.style !== "./dist/tokens.css") {
      throw new Error("@combric/tokens must advertise its CSS artifact");
    }
    if (!manifest.sideEffects?.includes("./dist/tokens.css")) {
      throw new Error("@combric/tokens CSS must be marked as a side effect");
    }
    await access(new URL("dist/tokens.css", packageUrl));
  }

  if (expectedName === "@combric/cli") {
    if (
      manifest.engines?.node !== ">=24.0.0" ||
      manifest.bin?.combric !== "./dist/bin.js"
    ) {
      throw new Error("@combric/cli must expose the Node 24 combric bin");
    }
    await access(new URL("dist/bin.js", packageUrl));
  }

  if (expectedName === "@combric/react") {
    if (
      manifest.exports?.["./css"] !== "./dist/index.css" ||
      manifest.style !== "./dist/index.css" ||
      !manifest.sideEffects?.includes("./dist/index.css")
    ) {
      throw new Error("@combric/react has an invalid CSS export contract");
    }
    if (manifest.dependencies?.["@combric/layout"] !== "workspace:*") {
      throw new Error("@combric/react must consume @combric/layout");
    }
    if (manifest.peerDependencies?.react !== ">=19.0.0 <20") {
      throw new Error("@combric/react must declare its React 19 peer range");
    }
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      if (
        Object.keys(manifest[field] ?? {}).some((name) =>
          name.includes("tailwind"),
        )
      ) {
        throw new Error("@combric/react must not depend on Tailwind");
      }
    }
    await access(new URL("dist/index.css", packageUrl));
  }

  if (expectedName === "@combric/layout") {
    if (manifest.exports?.["./css"] !== "./dist/index.css") {
      throw new Error("@combric/layout must expose its public CSS entry point");
    }
    if (manifest.dependencies?.["@combric/tokens"] !== "workspace:*") {
      throw new Error("@combric/layout must consume @combric/tokens");
    }
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      const dependencyNames = Object.keys(manifest[field] ?? {});
      if (
        dependencyNames.includes("react") ||
        dependencyNames.some((name) => name.includes("tailwind"))
      ) {
        throw new Error("@combric/layout must remain framework-independent");
      }
    }
  }

  if (expectedName === "@combric/tailwind") {
    if (manifest.dependencies?.["@combric/tokens"] !== "workspace:*") {
      throw new Error("@combric/tailwind must consume @combric/tokens");
    }
    if (manifest.peerDependencies?.tailwindcss !== ">=4.3.0 <5") {
      throw new Error(
        "@combric/tailwind must declare its Tailwind v4 peer range",
      );
    }
  }

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

for (const packageName of [
  "@combric/core",
  "@combric/tokens",
  "@combric/layout",
]) {
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

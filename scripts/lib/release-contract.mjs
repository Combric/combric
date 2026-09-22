import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
export const expectedRepository = "git+https://github.com/Combric/combric.git";

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function validateReleaseContract(contract, manifests) {
  if (contract.schemaVersion !== 1)
    throw new Error("Unsupported release manifest schema");
  if (!/^\d+\.\d+\.\d+$/.test(contract.version))
    throw new Error("Release version must be exact SemVer");
  if (
    contract.tag !== `v${contract.version}` ||
    contract.distTag !== "latest"
  ) {
    throw new Error(
      "Release tag or dist-tag differs from the stable release contract",
    );
  }
  if (!Array.isArray(contract.packages) || contract.packages.length === 0) {
    throw new Error("Release package set must not be empty");
  }

  const names = contract.packages.map(({ name }) => name);
  if (new Set(names).size !== names.length)
    throw new Error("Release package set contains duplicates");
  const positions = new Map(names.map((name, index) => [name, index]));

  for (const entry of contract.packages) {
    const manifest = manifests.get(entry.name);
    if (!manifest) throw new Error(`Missing release package ${entry.name}`);
    if (manifest.name !== entry.name || manifest.version !== contract.version) {
      throw new Error(
        `${entry.name} must have release version ${contract.version}`,
      );
    }
    if (manifest.private === true)
      throw new Error(`${entry.name} must be publishable`);
    if (manifest.license !== "MIT" || manifest.type !== "module") {
      throw new Error(`${entry.name} must be an MIT-licensed ESM package`);
    }
    if (
      manifest.repository?.url !== expectedRepository ||
      manifest.repository?.directory !== `packages/${entry.directory}`
    ) {
      throw new Error(`${entry.name} has invalid repository metadata`);
    }
    if (
      manifest.publishConfig?.access !== "public" ||
      manifest.publishConfig?.provenance !== true
    ) {
      throw new Error(
        `${entry.name} must require public access and provenance`,
      );
    }

    const declaredInternal = Object.entries(manifest.dependencies ?? {}).filter(
      ([name]) => name.startsWith("@combric/"),
    );
    const expectedDependencies = [...entry.dependencies].sort();
    if (
      JSON.stringify(declaredInternal.map(([name]) => name).sort()) !==
      JSON.stringify(expectedDependencies)
    ) {
      throw new Error(
        `${entry.name} internal dependencies differ from the release manifest`,
      );
    }
    for (const [dependency, range] of declaredInternal) {
      if (range !== "workspace:^")
        throw new Error(`${entry.name} must use workspace:^ for ${dependency}`);
      if (
        !positions.has(dependency) ||
        positions.get(dependency) >= positions.get(entry.name)
      ) {
        throw new Error(
          `${entry.name} has an invalid dependency order for ${dependency}`,
        );
      }
    }
  }
}

export async function loadReleaseContract(root = repositoryRoot) {
  const contract = await readJson(join(root, "release", "manifest.json"));
  const manifests = new Map();
  const packageDirectories = await readdir(join(root, "packages"), {
    withFileTypes: true,
  });
  const publicPackages = [];

  for (const directory of packageDirectories.filter((entry) =>
    entry.isDirectory(),
  )) {
    const manifest = await readJson(
      join(root, "packages", directory.name, "package.json"),
    );
    manifests.set(manifest.name, manifest);
    if (manifest.private !== true) publicPackages.push(manifest.name);
  }

  validateReleaseContract(contract, manifests);
  const expected = contract.packages.map(({ name }) => name).sort();
  if (JSON.stringify(publicPackages.sort()) !== JSON.stringify(expected)) {
    throw new Error(
      "Publishable workspace packages differ from the release package set",
    );
  }

  return { contract, manifests };
}

export function validatePackedDependencies(entry, manifest, version) {
  for (const field of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (/^(?:workspace:|file:|link:)/.test(range)) {
        throw new Error(
          `${entry.name} packed ${field}.${name} contains ${range}`,
        );
      }
      if (name.startsWith("@combric/") && range !== `^${version}`) {
        throw new Error(
          `${entry.name} packed dependency ${name} must be ^${version}`,
        );
      }
    }
  }
}

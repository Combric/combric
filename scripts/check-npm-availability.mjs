import { loadReleaseContract } from "./lib/release-contract.mjs";

const { contract } = await loadReleaseContract();
for (const { name } of contract.packages) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}`,
    { headers: { accept: "application/json" } },
  );
  if (response.status === 404) {
    console.log(`${name}@${contract.version} is not present.`);
    continue;
  }
  if (!response.ok)
    throw new Error(
      `npm registry returned ${response.status} for ${name}; availability is unverified`,
    );
  const metadata = await response.json();
  if (metadata.versions?.[contract.version])
    throw new Error(`${name}@${contract.version} is already published`);
  console.log(`${name}@${contract.version} is not present.`);
}

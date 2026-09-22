import { loadReleaseContract } from "./lib/release-contract.mjs";

const { contract } = await loadReleaseContract();
for (const { name } of contract.packages) {
  let published = false;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(name)}`,
      { headers: { accept: "application/json" } },
    );
    if (response.ok) {
      const metadata = await response.json();
      if (metadata.versions?.[contract.version]) {
        published = true;
        break;
      }
    } else if (response.status !== 404) {
      throw new Error(`npm registry returned ${response.status} for ${name}`);
    }
    if (attempt < 12)
      await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  if (!published)
    throw new Error(`${name}@${contract.version} could not be verified on npm`);
  console.log(`Verified ${name}@${contract.version} on npm.`);
}

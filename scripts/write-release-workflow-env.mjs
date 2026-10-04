import { appendFile } from "node:fs/promises";
import {
  loadReleaseContract,
  releaseMetadata,
} from "./lib/release-contract.mjs";

const githubEnvironment = process.env.GITHUB_ENV;
if (!githubEnvironment)
  throw new Error("GITHUB_ENV is required in the release workflow");

const { contract } = await loadReleaseContract();
const metadata = releaseMetadata(contract);
const values = {
  RELEASE_VERSION: metadata.version,
  RELEASE_TAG: metadata.tag,
  RELEASE_DIST_TAG: metadata.distTag,
  RELEASE_PRERELEASE: String(metadata.prerelease),
  RELEASE_ARTIFACT: metadata.artifactName,
};

await appendFile(
  githubEnvironment,
  `${Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`,
  "utf8",
);
console.log(`Loaded ${metadata.channel} release metadata for ${metadata.tag}.`);

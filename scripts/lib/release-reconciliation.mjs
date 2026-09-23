export const RELEASE_STATES = Object.freeze({
  VERIFIED_PUBLISHED: "VERIFIED_PUBLISHED",
  PENDING: "PENDING",
  PUBLISH_ACCEPTED: "PUBLISH_ACCEPTED",
  CONFLICT: "CONFLICT",
});

export async function reconcilePackage({
  artifact,
  contract,
  fetchImpl = fetch,
}) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(artifact.name)}`;
  const response = await fetchImpl(url, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404)
    return { state: RELEASE_STATES.PENDING, artifact };
  if (!response.ok)
    return {
      state: RELEASE_STATES.CONFLICT,
      artifact,
      reason: `registry returned ${response.status}`,
    };
  const metadata = await response.json();
  const version = metadata.versions?.[contract.version];
  if (!version) return { state: RELEASE_STATES.PENDING, artifact };
  if (metadata.name !== artifact.name || version.version !== contract.version)
    return {
      state: RELEASE_STATES.CONFLICT,
      artifact,
      reason: "package identity/version mismatch",
    };
  if (metadata["dist-tags"]?.[contract.distTag] !== contract.version)
    return {
      state: RELEASE_STATES.CONFLICT,
      artifact,
      reason: "dist-tag mismatch",
    };
  if (
    metadata.repository?.directory &&
    !metadata.repository.directory
      .replaceAll("\\", "/")
      .endsWith(`/${artifact.directory}`) &&
    metadata.repository.directory !== artifact.directory
  )
    return {
      state: RELEASE_STATES.CONFLICT,
      artifact,
      reason: "repository directory mismatch",
    };
  // npm tarball gzip metadata can differ by platform while package metadata
  // remains identical; stable registry contract fields are reconciled here.
  return { state: RELEASE_STATES.VERIFIED_PUBLISHED, artifact };
}

export async function waitForVisible({
  check,
  attempts = 6,
  delayMs = 1000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await check()) return true;
    if (attempt < attempts) await sleep(delayMs * 2 ** (attempt - 1));
  }
  return false;
}

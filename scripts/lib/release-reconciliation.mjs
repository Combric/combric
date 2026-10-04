export const RELEASE_STATES = Object.freeze({
  VERIFIED_PUBLISHED: "VERIFIED_PUBLISHED",
  PENDING: "PENDING",
  PUBLISH_ACCEPTED: "PUBLISH_ACCEPTED",
  CONFLICT: "CONFLICT",
});

export function reconcileMetadata({ artifact, contract, metadata }) {
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
  return reconcileMetadata({ artifact, contract, metadata });
}

/**
 * Waits for a whole coordinated release set to become visible on npm.
 *
 * npm accepts a publish before its registry metadata is immediately available.
 * Probe the outstanding packages together so the finalizer has one bounded
 * propagation window rather than one delay window per package.
 */
export async function verifyPublishedRelease({
  contract,
  reconcile = (artifact) => reconcilePackage({ artifact, contract }),
  attempts = 30,
  delayMs = 10_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console.log,
  warn = console.warn,
}) {
  let pending = [...contract.packages];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const results = await Promise.all(
      pending.map(async (artifact) => ({
        artifact,
        reconciliation: await reconcile(artifact),
      })),
    );
    const conflict = results.find(
      ({ reconciliation }) => reconciliation.state === RELEASE_STATES.CONFLICT,
    );
    if (conflict)
      throw new Error(
        `${conflict.artifact.name}@${contract.version} has a registry conflict: ${conflict.reconciliation.reason}`,
      );

    for (const { artifact, reconciliation } of results)
      if (reconciliation.state === RELEASE_STATES.VERIFIED_PUBLISHED)
        log(
          `Verified ${artifact.name}@${contract.version} on npm with ${contract.distTag}.`,
        );

    pending = results
      .filter(
        ({ reconciliation }) =>
          reconciliation.state !== RELEASE_STATES.VERIFIED_PUBLISHED,
      )
      .map(({ artifact }) => artifact);
    if (!pending.length) return;

    if (attempt < attempts) {
      warn(
        `Waiting for npm registry propagation (${attempt}/${attempts}): ${pending
          .map(({ name }) => name)
          .join(", ")}`,
      );
      await sleep(delayMs);
    }
  }

  throw new Error(
    `${pending.map(({ name }) => `${name}@${contract.version}`).join(", ")} could not be verified on npm with the ${contract.distTag} dist-tag after 5 minutes`,
  );
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

# COMBRIC 1.0 first-publish bootstrap

**ONE-TIME INITIAL RELEASE ONLY.** This is release engineering for the first
publication of the six new packages; it is not a permanent manual release
process. The normal path remains `release.yml` with npm Trusted Publishing and
OIDC.

## Why this exists

npm's current documentation states that a package must already exist on the
registry before a Trusted Publisher can be configured (`npm trust` also requires
the package to exist). Therefore the first publication must use the Product
Owner's already-authenticated local npm CLI session. Local publication cannot
claim the GitHub OIDC provenance produced by Trusted Publishing; no provenance
claim is made for this bootstrap.

## Prepare (no registry mutation)

From the exact approved `main` commit, run:

```sh
pnpm release:bootstrap --prepare
```

This reuses `pnpm release:artifacts`, verifies the exact six-package set,
1.0.0/latest contract, packed dependency ranges, tarball SHA-256 hashes, and
registry absence, then prints the deterministic order:

```text
@combric/tokens -> @combric/layout -> @combric/react -> @combric/tailwind -> @combric/cli -> @combric/guard
```

The command makes zero registry mutations. It never includes private
`@combric/core`.

## Authorized one-time publication

Only the Product Owner may run this after reviewing the prepare output, using an
already-authenticated npm CLI session (and any required interactive 2FA):

```sh
pnpm release:bootstrap --publish "PUBLISH APPROVED"
```

The exact authorization string is mandatory; `--yes` is not accepted. The script
publishes the verified tarballs one at a time with `--access public` and
`latest`, verifies registry visibility after each package, and stops on the
first unexpected failure. It never retries, overwrites, unpublishes, changes
versions, or mutates the package set. Partial publication is reported and must
be resolved manually; npm publication is non-transactional.

## Trusted Publishing handoff

Immediately after all six packages exist, configure a Trusted Publisher for
**each package** in npm package settings using the current npm field names:

- Provider: **GitHub Actions**
- Organization or user: **Combric**
- Repository: **combric**
- Workflow filename: **release.yml** (filename only)
- Environment name: **npm-release**
- Allow direct `npm publish` as required by the existing workflow

Confirm the repository URL matches exactly, then restrict token publishing where
appropriate. Future releases must use `release.yml` and OIDC exclusively.

## 1.0.0 finalization

Do not create `v1.0.0` or a GitHub Release until all six `@combric/*@1.0.0`
versions are verified publicly. The existing workflow's finalization stage
performs that verification before creating the tag and release. This amendment
itself performs neither action.

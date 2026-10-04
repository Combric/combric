# `@combric/menu` registry bootstrap and OIDC handoff

`@combric/menu` is a new npm package. npm requires the package to exist before
its GitHub Actions trusted publisher can be configured, so the first step is a
deliberately inert `0.0.0-bootstrap.0` artifact under the `bootstrap` dist-tag.
It is not an install candidate and does not replace the OIDC release artifact.

## Bootstrap

After the beta source commit is merged to `main`, dispatch
`Bootstrap Menu Package` with that exact commit and the approved input
`BOOTSTRAP APPROVED`. The protected `npm-bootstrap` environment supplies the
short-lived bootstrap credential; the normal release workflow never uses it.

## Trusted Publisher handoff

Once the bootstrap version is visible, a package maintainer must configure the
following npm Trusted Publisher for `@combric/menu`:

- provider: GitHub Actions;
- organization: `Combric`;
- repository: `combric`;
- workflow filename: `release.yml`;
- environment: `npm-release`;
- permission: allow direct `npm publish`.

This configuration requires package-maintainer authentication and may require
interactive 2FA. It must not be bypassed or replaced with a repository secret.
Afterward, the normal `Combric Release` workflow publishes beta, RC, and stable
artifacts with OIDC provenance.

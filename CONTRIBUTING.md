# Contributing to Combric

Combric is developed as a pnpm workspace on Node.js 24 or newer.

## Local validation

Install the pinned package manager through Corepack, install dependencies from
the lockfile, and run the complete quality gate:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm validate
```

Run `pnpm format` before submitting a change that affects formatted files.

## Changes

- Keep changes scoped to one roadmap milestone or concern.
- Do not introduce runtime dependencies without a demonstrated requirement.
- Preserve the dependency rules documented in the root README.
- Add tests for package contracts and behavior introduced by the change.
- Do not commit generated `dist` output or environment files.

## Stable compatibility

Combric follows Semantic Versioning. A breaking change includes removal or an
incompatible change to exported JavaScript/TypeScript APIs, React props, public
package or CSS entry points, documented CSS classes or custom properties, CLI
commands/options/documented behavior, Guard APIs, stable Guard rule IDs, or the
documented Guard JSON schema. Internal source layout, private helpers, tests,
and undocumented implementation details are not public compatibility contracts.

Breaking public changes require a major version. Additive compatible changes use
a minor version, and compatible fixes use a patch version. Keep the public
packages on the synchronized version declared by `release/manifest.json`.

## Release safety

`pnpm release:candidate` only prepares and verifies tarballs. Publication uses
the manually dispatched `.github/workflows/release.yml` workflow after a
separate Product Owner approval and protected npm environment approval. Never
publish from a pull request or ordinary `main` push.

Pull requests must pass the repository CI before merge.

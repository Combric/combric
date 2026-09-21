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

Pull requests must pass the repository CI before merge.

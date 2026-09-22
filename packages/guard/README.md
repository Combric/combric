# @combric/guard

Combric Guard is an optional, read-only checker for an existing consumer package
project. It does not run consumer code, rewrite files, install dependencies, use
the network, or replace application-level accessibility testing. Combric
packages remain usable without Guard.

This repository is prepared for release, but does not claim that the package has
been published to npm. After publication, install it with
`npm install --save-dev @combric/guard`. Node.js 24 or newer is required. The
public entry points are the package-root `checkProject` API and the
`combric-guard` executable. Then run:

```sh
pnpm exec combric-guard check
pnpm exec combric-guard check --json
pnpm exec combric-guard --help
```

Use `--project <directory>` to select an existing project explicitly. The bare
command is equivalent to `check`.

Guard inspects `package.json`, optional `combric.config.json` schema 1, and
bounded local CSS files. It checks declared Combric integrations, public CSS
entries, React 19 and Tailwind v4 compatibility where applicable, Tailwind
import order, and `var(--combric-...)` references against the public
`@combric/tokens` names. It does not ban arbitrary CSS values, parse JSX/TSX, or
enforce general accessibility or design policy.

Diagnostics have stable `GUARD_*` rule IDs and `pass`, `warning`, or `error`
severity. Exit 0 means the check completed with no errors (warnings are
allowed), 1 means one or more rule errors, and 2 means it could not complete.
JSON output is schema version 1 with `projectRoot: "."`, summary counts, and
deterministic diagnostics. Paths in diagnostics are project-relative.

The bounded scan skips symlinks and generated/dependency directories, limits
depth and entry count, and rejects oversized files. No consumer JavaScript or
TypeScript is imported or evaluated. Operational failures, such as an unreadable
project or unsafe configured CSS path, exit 2; review the reported cause rather
than bypassing it.

Guard is consumer-side validation. Repository maintainers separately use
`pnpm validate` and package-contract scripts. Automated accessibility tests are
separate and cannot establish complete application-level WCAG conformance.

## Project and license

Source and full documentation:
[Combric/combric](https://github.com/Combric/combric). Licensed under the
[MIT License](../../LICENSE).

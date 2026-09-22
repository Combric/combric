# `@combric/cli`

The optional `combric` command configures an **existing** package project and
reports its detected state. Applications can install and use Combric packages
without it. This repository is prepared for release, but does not claim that the
package has been published to npm.

After publication, install it with `npm install --save-dev @combric/cli`.
Node.js 24 or newer is required. The public entry points are the `combric`
executable and the package-root TypeScript/ESM declarations.

## Commands

| Command                   | Effect                                          |
| ------------------------- | ----------------------------------------------- |
| `combric --help`          | List the supported commands and options.        |
| `combric --version`       | Print the version from this package's metadata. |
| `combric info [--json]`   | Read-only project facts.                        |
| `combric doctor [--json]` | Read-only health checks.                        |
| `combric init`            | Configure an existing project after planning.   |

Use `--project <directory>` to select an existing package directory. Otherwise
the CLI searches upward from the current directory for `package.json`. `info`
and `doctor` never change project files. JSON output has `schemaVersion: 1` and
stable named fields; errors in JSON mode contain `error.code`, `error.message`,
and `exitCode`.

## Setup

Choose a mode and an **existing** CSS entry explicitly:

```sh
combric init --mode css --css-file src/styles.css --dry-run
combric init --mode css --css-file src/styles.css --yes
```

Supported modes:

- `css`: declare `@combric/tokens` and import `@combric/tokens/css`.
- `react`: declare `@combric/react`, React 19 and React DOM 19; import
  `@combric/react/css`.
- `tailwind`: require existing compatible Tailwind CSS `>=4.3 <5`; declare the
  optional adapter and import `tailwindcss` plus `@combric/tailwind`.
- `react-tailwind`: combine the React and optional Tailwind paths.

The CLI uses detected pnpm, npm, yarn, or bun evidence. If none exists, pass
`--package-manager <name>`. Conflicting metadata or lockfiles require manual
resolution. The CLI does not install a package manager, convert Tailwind
versions, guess a CSS file, or scaffold an application. If this is a workspace
root and packages are missing, select the intended member package with
`--project` so installation has a clear scope.

`--dry-run` returns the same operation plan used by `--yes` and makes no
persistent changes. `--dry-run --json` emits the plan for automation. An init
without `--yes` or `--dry-run` stops without prompting. Repeating a completed
init makes no changes.

Before publication, if a selected package is missing from an external project,
package-manager installation will fail until publication or a local
tarball/workspace is supplied. The CLI reports that failure and does not write
Combric CSS or config afterward. Local project fixtures and packed tarballs
verify this flow without public npm availability. On Windows, run setup through
the chosen package manager (for example, `pnpm exec combric`) so its JavaScript
entry is available for safe process spawning.

## Project config

Successful setup writes `combric.config.json`:

```json
{
  "schemaVersion": 1,
  "packageManager": "pnpm",
  "mode": "react",
  "cssFile": "src/styles.css"
}
```

The schema version is independent of the package version. Unknown schema
versions fail with guidance. `info` and `doctor` can report unknown fields;
`init` will not rewrite a config containing them. CSS target paths must stay
inside the project, exist already, and resolve inside it even through links.
Existing conflicting Combric imports are not overwritten.

## Exit behavior

- `0`: success; doctor may include warnings.
- `1`: invalid request, unsupported/conflicting setup, or doctor error checks.
- `2`: operational failure, including package-manager failure or partial init.

The CLI uses no telemetry, update check, component copying, or runtime
dependency in framework packages.

## Project and license

Source and full documentation:
[Combric/combric](https://github.com/Combric/combric). Licensed under the
[MIT License](../../LICENSE).

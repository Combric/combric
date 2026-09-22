# Combric

Combric is a native-first UI framework for modern web applications. It combines
canonical design tokens, framework-independent CSS layout, and accessible React
19 components. Standard CSS is the default path; Tailwind CSS, the setup CLI,
and Guard are optional.

> **Release-candidate source.** The repository is prepared for its first stable
> release, but the `@combric/*` packages are not claimed to be available on npm
> until publication is separately approved and completed.

## Packages

| Package                                            | Purpose                                                 | Public entry points             |
| -------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| [`@combric/tokens`](packages/tokens/README.md)     | Typed design tokens and generated CSS custom properties | `.`, `./css`                    |
| [`@combric/layout`](packages/layout/README.md)     | Native Grid and Flexbox layout primitives               | `.`, `./css`                    |
| [`@combric/react`](packages/react/README.md)       | React 19 component catalogue and typed layout wrappers  | `.`, `./css`                    |
| [`@combric/tailwind`](packages/tailwind/README.md) | Optional Tailwind CSS v4 adapter                        | `.`                             |
| [`@combric/cli`](packages/cli/README.md)           | Optional setup and diagnostics for existing projects    | `.`, `combric` executable       |
| [`@combric/guard`](packages/guard/README.md)       | Optional read-only integration checks                   | `.`, `combric-guard` executable |

`@combric/core` is an empty private repository boundary and is not part of the
public 1.0 release set.

## Install and use

The smallest native-CSS path uses tokens directly:

```sh
npm install @combric/tokens
```

```css
@import "@combric/tokens/css";

.panel {
  color: var(--combric-color-text);
  background: var(--combric-color-surface);
  padding: var(--combric-space-4);
}
```

For framework-independent layout:

```sh
npm install @combric/layout
```

```css
@import "@combric/layout/css";
```

```html
<main class="combric-container" data-size="wide">
  <section class="combric-grid" data-min-item-width="md" data-gap="4">
    ...
  </section>
</main>
```

For React 19:

```sh
npm install @combric/react react react-dom
```

```css
@import "@combric/react/css";
```

```tsx
import { Button, Card, Stack } from "@combric/react";

export function Example() {
  return (
    <Card>
      <Stack gap="4">
        <h2>Project</h2>
        <Button>Open</Button>
      </Stack>
    </Card>
  );
}
```

Applications already using Tailwind CSS `>=4.3.0 <5` can add the optional
adapter with `npm install @combric/tailwind tailwindcss` and import
`tailwindcss` before `@combric/tailwind`.

## Components and tooling

The React catalogue covers actions, layout, overlays, forms, feedback,
disclosure, navigation, and semantic data display. The CLI can inspect,
diagnose, and configure an existing project. Guard performs bounded, offline,
read-only checks of package declarations, Combric CSS imports, supported React
and Tailwind ranges, and token references. Guard is not a complete application
validator or WCAG certification tool.

See each package README for its supported API and the static documentation in
[`apps/docs`](apps/docs/README.md) for guides, component examples, Foundations,
and the controlled Playground.

## Supported environment

- Node.js 24 or newer for the CLI, Guard, and repository tooling.
- React and React DOM `>=19.0.0 <20` for `@combric/react`.
- Tailwind CSS `>=4.3.0 <5` for the optional adapter.
- Modern browsers for the emitted standard CSS and native semantics.

## Development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm validate
```

The complete contributor workflow, breaking-change discipline, and release
safety rules are documented in [CONTRIBUTING.md](CONTRIBUTING.md). Release
preparation additionally uses `pnpm release:candidate`; it packs and verifies
local artifacts without publishing them.

## License

Combric is available under the [MIT License](LICENSE).

# Combric

Combric is a performance-first UI framework for modern web applications.

The project is building a production-grade foundation for application UI: a
native, static CSS system; design tokens; React components; layout primitives;
application recipes; scaffolding; and design-system enforcement. Combric CSS is
the default styling system. Tailwind is an optional adapter and is not a
dependency of the core layout or React packages.

## Repository status

This repository contains the foundations delivered from **COMBRIC-0.2** through
**COMBRIC-0.6**: monorepo tooling, canonical design tokens, the optional
Tailwind adapter, React component primitives, and the framework-independent Grid
& Layout System. Recipes, expanded components, Guard rules, and benchmark
results intentionally belong to later milestones.

## Requirements

- Node.js 24 or newer
- pnpm 11 or newer (the exact package-manager version is recorded in
  `package.json`)

## Development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm validate
```

Individual quality gates are available as `pnpm format:check`, `pnpm lint`,
`pnpm typecheck`, `pnpm build`, `pnpm test`, and `pnpm validate:packages`.

## Workspace map

- `packages/core` — renderer-independent runtime boundary
- `packages/tokens` — canonical typed tokens and generated public CSS variables
- `packages/layout` — framework-independent CSS Grid and Flexbox primitives
- `packages/tailwind` — optional Tailwind v4 semantic theme adapter
- `packages/react` — React components and typed layout wrappers
- `packages/cli` — command-line tooling boundary
- `packages/guard` — design-system enforcement tooling boundary
- `apps` — future documentation and playground applications
- `benchmarks` — future reproducible benchmark/reference applications

## Architectural constraints

- `@combric/core` does not depend on React or Tailwind.
- `@combric/tokens` does not depend on React or Tailwind.
- `@combric/layout` depends only on `@combric/tokens`.
- `@combric/react` consumes `@combric/layout` and does not depend on Tailwind.
- CLI and Guard are tooling, not runtime requirements for applications.
- Tailwind integration is optional and depends only on `@combric/tokens`.

These constraints are enforced by `pnpm validate:packages` and CI.

## Design tokens and standard CSS

The default Combric design language is `metriq`. Primitive values and semantic
references are defined once in `@combric/tokens`; the build generates the public
CSS contract from that typed source. Metriq uses square geometry, represented by
the semantic `radius` token resolving to `0`.

Standard CSS consumers can use the package without Tailwind:

```css
@import "@combric/tokens/css";

.content-panel {
  color: var(--combric-color-text);
  background: var(--combric-color-surface);
  padding: var(--combric-space-4);
  border-radius: var(--combric-radius);
}
```

Typed ESM consumers can import `metriq`, `primitiveTokens`, `semanticTokens`,
the semantic reference map, and their public CSS custom-property names from
`@combric/tokens`. See [`packages/tokens/README.md`](packages/tokens/README.md)
for the complete contract.

## Grid and layout

Standard CSS consumers import the public framework-independent entry:

```css
@import "@combric/layout/css";
```

The stable `combric-container`, `combric-stack`, `combric-inline`,
`combric-cluster`, and `combric-grid` classes use canonical gap, content-width,
and intrinsic item-size variables. Responsive Grid uses native
`repeat(auto-fit, minmax(...))`; no viewport JavaScript or breakpoint runtime is
present. See [`packages/layout/README.md`](packages/layout/README.md).

React consumers receive typed `Container`, `Stack`, `Inline`, `Cluster`, and
`Grid` wrappers from `@combric/react`. Importing `@combric/react/css` includes
the layout and token CSS contracts.

## Tailwind adapter

`@combric/tailwind` supports Tailwind CSS `>=4.3.0 <5` through the CSS-first
`@theme inline` API. It maps Tailwind theme variables to the existing public
Combric custom properties; it does not copy token values or introduce a second
source of truth.

```css
@import "tailwindcss";
@import "@combric/tailwind";
```

This enables semantic utilities such as `bg-combric-surface`,
`text-combric-foreground`, `border-combric`, `p-combric-4`, and
`rounded-combric`. The radius utility resolves through the metriq radius
contract and is square by default. See
[`packages/tailwind/README.md`](packages/tailwind/README.md) for the supported
consumer setup.

## License

Combric is licensed under the [MIT License](LICENSE). A permissive license was
chosen to support broad use in commercial and open-source applications without
introducing commercial/Pro licensing into the Community framework.

# Combric

Combric is a performance-first UI framework for modern web applications.

The project is building a production-grade foundation for application UI: a
native, static CSS system; design tokens; React components; layout primitives;
application recipes; scaffolding; and design-system enforcement. Combric CSS is
the default styling system. Tailwind is planned as an optional adapter and is
not a dependency of the core.

## Repository status

This repository contains the **COMBRIC-0.2 monorepo foundation** and the
**COMBRIC-0.3 design-token and CSS foundation**. Public component APIs, the CSS
component engine, layouts, recipes, Guard rules, and benchmark results
intentionally belong to later milestones.

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
- `packages/react` — React renderer boundary
- `packages/cli` — command-line tooling boundary
- `packages/guard` — design-system enforcement tooling boundary
- `apps` — future documentation and playground applications
- `benchmarks` — future reproducible benchmark/reference applications

## Architectural constraints

- `@combric/core` does not depend on React or Tailwind.
- `@combric/tokens` does not depend on React or Tailwind.
- `@combric/react` is the initial renderer integration.
- CLI and Guard are tooling, not runtime requirements for applications.
- Tailwind integration will remain optional and outside the core dependency
  graph.

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

## License

Combric is licensed under the [MIT License](LICENSE). A permissive license was
chosen to support broad use in commercial and open-source applications without
introducing commercial/Pro licensing into the Community framework.

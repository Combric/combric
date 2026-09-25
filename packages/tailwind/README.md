# @combric/tailwind

`@combric/tailwind` is the official Tailwind CSS adapter for Combric. It makes
the semantic `metriq` design contract available through Tailwind utilities while
keeping `@combric/tokens` as the only source of design-token values.

## Compatibility and dependencies

- Tailwind CSS: `>=4.3.0 <5`
- `@combric/tokens`: runtime CSS dependency
- JavaScript runtime: none

The adapter uses Tailwind v4's CSS-first `@theme inline` mechanism. It does not
provide a legacy JavaScript preset or plugin, and it does not bundle Tailwind.

## Setup

Install `@combric/tailwind` and Tailwind CSS in the consumer workspace:

```sh
npm install @combric/tailwind tailwindcss
```

The sole public entry point is the CSS import `@combric/tailwind`. Use this
order in the application's primary stylesheet:

```css
@import "tailwindcss";
@import "@combric/tailwind";
```

The adapter import includes `@combric/tokens/css`, so no internal `dist` path or
second token import is required.

Use the semantic utilities in application markup:

```html
<article
  class="border-combric border-combric-border bg-combric-surface p-combric-4 text-combric-foreground rounded-combric"
>
  Combric content
</article>
```

Representative utility families include:

- `bg-combric-canvas`, `bg-combric-surface`
- `bg-combric-primary`, `text-combric-link`, and elevated/invalid semantic
  colors
- `bg-combric-backdrop` and `z-combric-overlay`, `z-combric-modal`,
  `z-combric-toast` from the canonical overlay-layer contract
- `text-combric-invalid` and related color utilities derived from the shared
  invalid-state token
- `text-combric-foreground`, `text-combric-muted-foreground`
- `border-combric`, `border-combric-strong`, `border-combric-border`
- `p-combric-*`, `gap-combric-*`, and control-size utilities derived from the
  Combric spacing contract
- `font-combric-body`, `font-combric-code`, `text-combric-body`, and
  `text-combric-heading-*`
- `max-w-combric-prose`, `max-w-combric-wide`
- `grid-combric-auto-sm`, `grid-combric-auto-md`, and `grid-combric-auto-lg` for
  canonical intrinsic Grid minimums
- `rounded-combric`, `rounded-combric-button`, `rounded-combric-card`,
  `rounded-combric-control`, and the other semantic geometry utilities

`rounded-combric` resolves through `--combric-radius`. Under the default
`metriq` contract that legacy-compatible alias remains `0`. Component-specific
utilities such as `rounded-combric-button` and `rounded-combric-card` resolve to
their canonical `0.25rem` defaults. Override the shared semantic CSS variables
to customize either theme or geometry; Tailwind introduces no independent
palette or radius values. `[data-theme="dark"]` selects the same dark mapping
used by Native CSS consumers.

Every adapter theme value points to an existing public `--combric-*` custom
property. No color, spacing, typography, sizing, or radius literal is duplicated
inside this package.

Tailwind remains optional. Projects using ordinary CSS can continue importing
`@combric/layout/css` directly without installing Tailwind or this adapter.
Tailwind's own `grid`, `flex`, `grid-cols-*`, and alignment utilities remain the
low-level layout surface; Combric does not rename or duplicate them.

Components, alternate themes, runtime theme switching, and framework-specific UI
are intentionally outside this package.

## Project and license

Source and full documentation:
[Combric/combric](https://github.com/Combric/combric). Licensed under the
[MIT License](../../LICENSE).

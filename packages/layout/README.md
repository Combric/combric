# @combric/layout

Framework-independent CSS layout primitives for Combric. The package uses native
Grid and Flexbox, imports the canonical `@combric/tokens/css` contract, and has
no React or Tailwind dependency.

## Setup

```css
@import "@combric/layout/css";
```

No internal `dist` path is part of the public contract.

## Container

```html
<main class="combric-container" data-size="wide">...</main>
```

Container is centered, full-width up to the selected canonical content width,
and applies the standard horizontal gutter. Supported sizes are `prose`, `wide`
(default), and `full`. Nested containers remain box-sized and predictable.

## Stack, Inline, and Cluster

```html
<div class="combric-stack" data-gap="6">...</div>
<div class="combric-inline" data-gap="3" data-align="baseline">...</div>
<div class="combric-cluster" data-gap="2" data-align="center">...</div>
```

Stack is vertical. Inline is a non-wrapping horizontal sequence. Cluster is a
wrapping horizontal group for actions, tags, and metadata. This wrapping
contract keeps Inline and Cluster distinct without exposing the full Flexbox
surface as framework API.

Gap values are the canonical Combric spacing keys: `0`, `1`, `2`, `3`, `4`, `6`,
`8`, `12`, and `16`. Inline and Cluster alignments are `start`, `center`, `end`,
and `baseline`.

## Grid

Intrinsic Grid is the default:

```html
<div class="combric-grid" data-min-item-width="md" data-gap="4">...</div>
```

It uses `repeat(auto-fit, minmax(...))` with canonical `sm`, `md`, and `lg`
minimum item widths. Columns collapse intrinsically without viewport JavaScript,
hydration state, breakpoints, or resize listeners.

Explicit one-to-four-column layouts are also supported:

```html
<div class="combric-grid" data-columns="3" data-gap="6">...</div>
```

Explicit columns are intentionally non-responsive. Use intrinsic mode for the
standard responsive path. Native classes and CSS remain the escape hatch for a
specialized layout; no arbitrary-value API or responsive object DSL is added.

## Accessibility and scope

Layout classes do not change source order, add ARIA, intercept input, or manage
focus. Consumers retain responsibility for choosing semantic HTML elements.
Masonry, placement solvers, drag-and-drop, runtime measurement, CSS ordering
APIs, and adaptive JavaScript are intentionally outside this package.

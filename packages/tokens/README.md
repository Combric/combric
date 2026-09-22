# @combric/tokens

`@combric/tokens` is the framework-independent design-token foundation for
Combric. Its typed definitions are the canonical source for both programmatic
consumers and the generated CSS contract.

Install the release package with `npm install @combric/tokens`. It supports
modern ESM tooling and browsers; Node.js 24 or newer is required for repository
build tooling. The public entry points are `@combric/tokens` for JavaScript and
TypeScript and `@combric/tokens/css` for CSS.

The default design language is **metriq**: restrained, editorial, and square by
default. The semantic `radius` token resolves to `0`; future components can use
that contract without scattering hard-coded geometry rules.

## CSS

Import the public stylesheet without Tailwind or another framework:

```css
@import "@combric/tokens/css";

.article-panel {
  color: var(--combric-color-text);
  background: var(--combric-color-surface);
  border: var(--combric-border-width) var(--combric-border-style)
    var(--combric-color-border);
  border-radius: var(--combric-radius);
  padding: var(--combric-space-4);
}
```

All public custom properties use the `--combric-*` namespace. Primitive values
are emitted as `--combric-primitive-*`; semantic properties reference those
primitives so their relationship remains explicit in CSS.

## ESM and TypeScript

The package exposes immutable primitive values, semantic references, resolved
semantic values, CSS custom-property names, and the `metriq` contract:

```ts
import {
  metriq,
  semanticCssVariableNames,
  semanticTokens,
} from "@combric/tokens";

semanticTokens["color.canvas"];
semanticCssVariableNames["color.canvas"];
metriq.semantic.radius;
```

Primitive tokens contain raw reusable values. Semantic tokens name UI roles and
map to primitives. The CSS file is generated from these typed definitions during
the repository build; it is not maintained as a second source of truth.

The package has no React or Tailwind dependency. The optional
`@combric/tailwind` adapter consumes this contract rather than redefining it.

The contract includes the deliberately small `size.layout.item.sm`, `.md`, and
`.lg` semantic contract. These values provide safe intrinsic Grid minimums for
framework-independent CSS, React, and Tailwind consumers without introducing a
breakpoint scale or arbitrary layout-value API.

The `color.invalid` semantic token is the shared native-control invalid-state
contract. It resolves to the deliberately limited `color.red.700` primitive;
Combric styles invalid state but does not implement validation logic.

The minimum overlay-specific contract is `color.backdrop` plus
`z.index.overlay`, `z.index.modal`, and `z.index.toast`. These roles keep
backdrops and layer ordering canonical instead of scattering arbitrary colors or
z-index values through component CSS. The order is modal, anchored overlay, then
toast, so a menu, popover, or tooltip opened from modal content remains visible
while notifications stay highest. The contract does not define shadows,
elevation effects, or a generalized layering engine.

The motion contract includes `motion.duration.fast` and `motion.duration.slow`.
They provide the two canonical durations used by the Spinner and Skeleton CSS
animations. They do not introduce an animation framework; consumers that prefer
reduced motion receive static component styling through the React stylesheet's
media query.

## Project and license

Source and full documentation:
[Combric/combric](https://github.com/Combric/combric). Licensed under the
[MIT License](../../LICENSE).

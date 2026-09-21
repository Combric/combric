# @combric/tokens

`@combric/tokens` is the framework-independent design-token foundation for
Combric. Its typed definitions are the canonical source for both programmatic
consumers and the generated CSS contract.

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

The package has no React or Tailwind dependency. A future Tailwind adapter must
consume this contract rather than redefine it.

# @combric/icons

Standalone SVG, CSS, metadata, and React icons for Combric.

The package is generated from the official Iconoir SVG sources. The current
development source is pinned to `iconoir@7.12.1`; the generated package keeps
Iconoir's MIT license in `dist/ICONOIR-LICENSE` alongside Combric's license.

## React

```tsx
import { ActivityIcon } from "@combric/icons";

export function SaveButton() {
  return (
    <button type="button">
      <ActivityIcon aria-hidden="true" />
      Activity
    </button>
  );
}
```

Icons are decorative by default. Pass `aria-label`, `aria-labelledby`, or a
`title` when the icon itself communicates information. `size`, `width`,
`height`, `color`, `strokeWidth`, `className`, and standard SVG props are
supported.

The root entry point exposes regular icons. Solid icons are available from the
solid entry point:

```tsx
import { AdobeAfterEffectsIcon } from "@combric/icons/solid";
```

Use an individual module when a direct subpath is preferable for bundling:

```tsx
import { ActivityIcon } from "@combric/icons/regular/activity";
```

## Standard CSS

The CSS entry point does not require React:

```css
@import "@combric/icons/css";
```

```html
<span class="combric-icon combric-icon-save" aria-hidden="true"></span>
```

Regular and solid styles can also be imported independently with
`@combric/icons/css/regular` and `@combric/icons/css/solid`.

## SVG and metadata

The original SVG surfaces are available through the package exports:

```js
import saveSvg from "@combric/icons/svg/regular/save.svg";
```

The `@combric/icons/metadata` entry point exposes the typed catalog. The JSON
metadata entry point is intended for tools such as Combric Studio and Explorer.

## Source and license

Icon assets are generated from [Iconoir](https://iconoir.com), which is
available under the MIT license. See the bundled `ICONOIR-LICENSE` file and the
[Combric repository](https://github.com/Combric/combric) for source and
framework licensing.

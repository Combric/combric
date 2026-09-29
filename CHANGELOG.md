# Changelog

All notable public changes will be documented here. Combric follows Semantic
Versioning, and all public packages use one synchronized version.

## [1.3.1] - 2026-09-29

Combric Framework patch release.

- Fixed `@combric/cli` and `@combric/guard` so public Icons CSS imports are
  accepted alongside the React consumer setup and still require `@combric/icons`
  as a dependency.

Published packages:

- `@combric/tokens@1.3.1`;
- `@combric/icons@1.3.1`;
- `@combric/layout@1.3.1`;
- `@combric/react@1.3.1`;
- `@combric/tailwind@1.3.1`;
- `@combric/cli@1.3.1`;
- `@combric/guard@1.3.1`.

## [1.3.0] - 2026-09-28

Combric Framework minor release.

- Added the public `@combric/icons` package with regular and solid Iconoir
  assets, React components, CSS, SVG, and typed metadata.
- Added composable `ReactNode` icon slots to interactive controls, navigation,
  titles, and empty-state media without coupling `@combric/react` to an icon
  library.

Published packages:

- `@combric/tokens@1.3.0`;
- `@combric/icons@1.3.0`;
- `@combric/layout@1.3.0`;
- `@combric/react@1.3.0`;
- `@combric/tailwind@1.3.0`;
- `@combric/cli@1.3.0`;
- `@combric/guard@1.3.0`.

## [1.1.1] - 2026-09-26

Combric Framework patch release.

- Fixed Avatar fallback state when `AvatarImage` was already loaded from cache
  before mount.

Published packages:

- `@combric/tokens@1.1.1`;
- `@combric/layout@1.1.1`;
- `@combric/react@1.1.1`;
- `@combric/tailwind@1.1.1`;
- `@combric/cli@1.1.1`;
- `@combric/guard@1.1.1`.

## [1.1.0] - 2026-09-25

Combric Framework remediation release.

- Added component-appropriate geometry: Button and Card default to 0.250rem,
  with bounded `none | sm | md | lg | full` radius presets and functional
  geometry roles for controls and overlays, customizable through public tokens
  and CSS variables.
- Added the approved Combric Light semantic identity and a Dark semantic theme,
  with public color and geometry contracts shared by Native CSS and Tailwind.
- Added Button `accent` and `danger` variants, Card tones, and public
  radius-related component API.
- Synchronized the native Slider filled track with its current value and range
  while preserving native input semantics, keyboard behavior, form reset, and
  controlled/uncontrolled support.
- Corrected Toast list and live-region semantics for accessible status and alert
  announcements.

Published packages:

- `@combric/tokens@1.1.0`;
- `@combric/layout@1.1.0`;
- `@combric/react@1.1.0`;
- `@combric/tailwind@1.1.0`;
- `@combric/cli@1.1.0`;
- `@combric/guard@1.1.0`.

## [1.0.0] - 2026-09-23

Initial stable release, including:

- typed design tokens and public CSS custom properties;
- framework-independent native CSS layout primitives;
- accessible React 19 component primitives and public component CSS;
- optional Tailwind CSS v4 adapter;
- optional project setup and diagnostics CLI;
- optional read-only Guard API and executable with stable rule IDs and JSON
  schema 1;
- static documentation, component catalogue, Foundations references, and
  accessibility regression coverage.

Published packages:

- `@combric/tokens@1.0.0`;
- `@combric/layout@1.0.0`;
- `@combric/react@1.0.0`;
- `@combric/tailwind@1.0.0`;
- `@combric/cli@1.0.0`;
- `@combric/guard@1.0.0`.

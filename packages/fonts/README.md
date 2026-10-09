# @combric/fonts

Official Fontsource typography preset for Combric. It supplies self-hosted
variable faces for **Inter** (body and interface) and **JetBrains Mono** (code),
then connects them to Combric's existing font token stacks.

Install with `npm install @combric/fonts`. It is CSS-only: there is no
JavaScript runtime, React provider, network request to Google, or font binary in
the Combric tarball. A compatible bundler emits the WOFF2 assets from the two
Fontsource dependencies into the consuming application.

## Setup

Import the preset after the Combric stylesheet used by the application:

```css
@import "@combric/react/css";
@import "@combric/fonts/css";
```

`@combric/fonts` also imports `@combric/tokens/css`, so it can be used with the
standard CSS path. Fontsource's default variable CSS uses `font-display: swap`
and `unicode-range`; browsers fetch only the relevant character sets.

## Use another provider

The provider is replaceable. Load a font from Google Fonts, Adobe Fonts, a
corporate service, or local `@font-face` rules, then override the public
primitive stacks after this preset:

```css
@font-face {
  font-family: "Acme Sans";
  font-style: normal;
  font-weight: 100 900;
  src: url("/fonts/acme-sans-variable.woff2") format("woff2");
  font-display: swap;
}

:root {
  --combric-primitive-font-family-sans:
    "Acme Sans", ui-sans-serif, system-ui, sans-serif;
}
```

Overriding the primitive stack preserves the `body` and `code` semantic roles in
both Combric themes. Consumers are responsible for the licences and distribution
terms of replacement fonts.

## Licences

The Combric CSS in this package is licensed under the
[MIT License](../../LICENSE). Its default dependencies,
`@fontsource-variable/inter@5.3.0` and
`@fontsource-variable/jetbrains-mono@5.3.0`, are licensed under SIL OFL 1.1;
their licence files ship with their respective packages.

## Project

Source and full documentation:
[Combric/combric](https://github.com/Combric/combric).

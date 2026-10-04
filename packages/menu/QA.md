# `@combric/menu` QA and promotion gate

This file defines the quality gate for the first `@combric/menu` alpha
candidate. It is intentionally separate from a registry release decision.

## Automated package gate

`pnpm validate` must be green. In addition to the repository-wide checks, it now
requires both of these menu-specific gates:

- `pnpm test:menu:packed` installs tarballs for Tokens, Layout, React, and Menu
  into an isolated offline consumer. It type-checks and server-renders the
  public Action Menu, Context Menu, Navigation Menu, Menubar, and Bottom
  Navigation APIs, and verifies the public CSS and package exports.
- `pnpm validate:menu:budget` packs the actual `@combric/menu` artifact and
  fails if it exceeds 32,768 bytes or 40 files.

The budget is a packed-artifact guard, not a claim about every application's
tree-shaken bundle. A consumer's final bundle also depends on its imports,
compiler, React, and shared Combric dependencies. The current first-alpha
baseline is 26,026 bytes and 32 files, leaving 6,742 bytes and eight files of
explicit headroom.

## Sprint 6 local browser evidence

The compiled package was rendered in a local Chromium preview on 2026-10-04. The
accessibility tree exposed the following real interactions:

- the Mega Menu trigger changed from collapsed to expanded and revealed a
  labelled region with three named image/card links;
- the Action Menu opened as a labelled menu, moved focus with Arrow Down, and
  returned focus to its trigger with Escape;
- the Menubar opened its labelled menu, moved between items with Arrow Down, and
  returned focus to the File trigger with Escape;
- a right-click opened the Context Menu as a menu, and Escape dismissed it;
- the Bottom Navigation exposed a native navigation list with named links and an
  active current-page link.

The local preview had no browser console errors. This is reproducible browser
and accessibility-tree evidence, not a substitute for manual screen-reader
acceptance.

## Rich Mega Menu visual acceptance

The package intentionally owns disclosure semantics, focus, dismissal, and the
wide panel. Product hierarchy remains consumer composition inside
`NavigationMenuContent`: this avoids turning a navigation primitive into a fixed
catalog of brand-specific widgets.

When reviewing a rich Mega Menu, accept at least these visual content recipes:

- clear intent-based link groups such as Products, Solutions, Roles, Industries,
  or Resources, using plain-language headings and short descriptions where they
  disambiguate similar destinations;
- an asymmetric hierarchy when useful: a featured product/image card, customer
  story, promotional CTA, or “view all” route alongside ordinary link groups;
- either category rails plus detail cards, or compact multi-column link groups;
  the consumer may use normal Grid, CSS, icons, images, forms, or role selectors
  without making any of them a menu runtime dependency;
- spacious, scannable desktop panels that can become an intentionally wide
  overlay, while compact layouts move the same content into a tap-friendly
  Drawer or disclosure/accordion pattern with large targets.

Hover can enhance a desktop panel but never gates access. The visual pattern
must preserve the click and keyboard path, logical link order, named images, and
a predictable close action.

## Accessibility and browser acceptance

The automated suite uses axe-core and keyboard interaction checks for Action
Menu, SideNav, Navigation Menu, Context Menu, and Menubar. It covers semantic
roles, focus restoration, Escape, directional navigation, Home/End where
applicable, and rich Navigation Menu content with images and links.

Before a beta promotion, record manual results for these product scenarios in
real browsers:

| Surface                  | Browser behavior                                                                    | Assistive technology acceptance                                 |
| ------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Action and Context Menu  | Trigger, outside dismissal, disabled entries, keyboard selection                    | Announced as menus with usable item names and state             |
| Navigation and Mega Menu | Click and keyboard disclosure, rich image/card/CTA content, compact Drawer fallback | Announced as navigation/disclosure, not an application menu     |
| Menubar                  | Roving trigger focus, arrows, typeahead, Escape and focus return                    | Announced as a menubar and usable menu items                    |
| Bottom Navigation        | Native link navigation and active-page state                                        | Native navigation/list/link structure and current page conveyed |

An axe result or accessibility-tree inspection is not a screen-reader pass. The
beta gate therefore needs a documented NVDA + Firefox or Chromium pass and a
VoiceOver + Safari pass; the final compatibility matrix may add browsers based
on the supported-product policy.

## Promotion boundaries

| Promotion       | Required evidence                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alpha candidate | Green package QA, packed-consumer gate, budget gate, and browser/accessibility-tree inspection. No npm publication is implied.                                    |
| Beta            | Manual screen-reader evidence, public version and publication policy, stable API inventory, and an approved release contract that includes `@combric/menu`.       |
| RC              | No unresolved accessibility or package-budget regressions, release artifacts validated from the exact approved commit, and a downstream reference-consumer check. |
| Stable          | Approved merge to `main`, the canonical OIDC Stable Release workflow, registry/provenance verification, and post-release downstream validation.                   |

At Sprint 6 completion the package remains private at `0.0.0` and is not in the
repository release manifest. That is deliberate: making it public, assigning
beta/RC/stable versions, amending the release contract, publishing, tagging, and
releasing require an explicit release decision.

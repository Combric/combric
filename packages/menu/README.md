# `@combric/menu`

`@combric/menu` provides composable, accessible navigation systems and advanced
application-menu patterns for React 19.

```sh
npm install @combric/menu @combric/react @combric/layout react react-dom
```

```css
@import "@combric/menu/css";
```

## Families

- `ActionMenu` provides action, checkbox, and radio menu items with labels,
  separators, positioning, dismissal, typeahead, and focus restoration.
- `Navigation` and `SideNav` preserve native website navigation markup;
  expandable groups are disclosures, not application menus. Router links use a
  typed `render` callback.
- `NavigationMenu` and its `MegaMenu` alias provide one expanded disclosure
  panel at a time. Compose ordinary React card grids, responsive images,
  descriptions, links, and CTAs inside `NavigationMenuContent`.
- `ContextMenu` and `Menubar` are application-menu patterns with their own
  keyboard and role contracts.
- `BottomNavigation` remains ordinary semantic link navigation with active-page
  state. Its surface, list, links, and labels accept direct spacing and label
  customisation without changing the native navigation/list/link structure.

Website navigation and application menus are intentionally distinct. A rich Mega
Menu has a click and keyboard path even when `openOnHover` enhances desktop use;
compact layouts should compose the same content in the existing `Drawer` from
`@combric/react` instead of relying on hover.

Generic primitives remain in `@combric/react`: Drawer, Dialog, Tabs, Breadcrumb,
Popover, Tooltip, and the basic DropdownMenu. `@combric/menu` builds on the
shared `@combric/react/overlay` foundation without duplicating it.

## Bottom Navigation spacing and labels

The default label group is vertically centred, including when a link has no
icon. Consumers can keep labels as children or supply `label`, then tune the
surface, list, link, and label independently:

```tsx
<BottomNavigation aria-label="Mobile" margin="0 auto" padding="0.25rem">
  <BottomNavigationList gap="0.25rem">
    <BottomNavigationLink
      active
      href="/home"
      label="Home"
      padding="0.5rem 1rem"
      labelStyle={{ fontWeight: 700 }}
    />
  </BottomNavigationList>
</BottomNavigation>
```

The ordinary `className` and `style` props remain available for design-system
tokens or responsive styles.

See [QA.md](QA.md) for the product, browser, package-budget, and promotion
criteria for the current prerelease train.

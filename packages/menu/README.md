# `@combric/menu`

`@combric/menu` is the home of Combric navigation systems and advanced menu
primitives.

It is intentionally private while its API matures, but it can be consumed by the
Combric workspace. Sprint 2 introduces the composable `ActionMenu` family: the
root, trigger, positioned content, action items, checkbox and radio items,
labels, and separators. It uses the shared `@combric/react/overlay` foundation
for portals, positioning, layering, dismissal, and focus restoration.

Sprint 3 adds semantic `Navigation` and `SideNav` composition. Website
navigation remains native `nav`, list, and link markup; expandable SideNav
groups are disclosure buttons, never `role="menu"`. Router consumers can use a
typed `render` callback rather than cloned children. Compact layouts compose the
existing `Drawer` from `@combric/react`.

Generic primitives remain in `@combric/react`: Drawer, Dialog, Tabs, Breadcrumb,
Popover, Tooltip, and the basic DropdownMenu. Future Menu milestones add
NavigationMenu and related systems without duplicating those primitives.

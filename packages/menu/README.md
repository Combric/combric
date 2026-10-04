# `@combric/menu`

`@combric/menu` is the home of Combric navigation systems and advanced menu
primitives.

It is intentionally private while its API matures, but it can be consumed by the
Combric workspace. Sprint 2 introduces the composable `ActionMenu` family: the
root, trigger, positioned content, action items, checkbox and radio items,
labels, and separators. It uses the shared `@combric/react/overlay` foundation
for portals, positioning, layering, dismissal, and focus restoration.

Generic primitives remain in `@combric/react`: Drawer, Dialog, Tabs, Breadcrumb,
Popover, Tooltip, and the basic DropdownMenu. Future Menu milestones add
Navigation, SideNav, NavigationMenu, and related systems without duplicating
those primitives.

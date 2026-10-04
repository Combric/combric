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

Sprint 4 adds `NavigationMenu` (also exported as `MegaMenu`) for rich website
navigation panels. A menu has one expanded disclosure panel at a time; consumers
place their own card grids, responsive images, descriptions, links, and CTAs in
`NavigationMenuContent`. It preserves ordinary navigation and disclosure
semantics instead of applying `role="menu"` to page navigation. Click and
keyboard activation are always available; `openOnHover` is an optional desktop
convenience, never the only activation path. On compact layouts, compose the
same content inside the existing `Drawer` from `@combric/react` rather than
forcing a hover-only menu.

Sprint 5 completes the first-alpha contextual and compact-navigation family:
`ContextMenu` is a pointer-anchored application action menu with correct menu
semantics and keyboard support; `Menubar` is an application menubar with roving
trigger focus; `BottomNavigation` remains native website navigation with
ordinary links. These roles are deliberately distinct: a `Menubar` or
`ContextMenu` is not a substitute for the semantic `Navigation` family.

Generic primitives remain in `@combric/react`: Drawer, Dialog, Tabs, Breadcrumb,
Popover, Tooltip, and the basic DropdownMenu. Future Menu milestones add related
systems without duplicating those primitives.

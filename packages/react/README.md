# @combric/react

Accessible React 19 component primitives styled with the canonical Combric
design-token contract. The package does not require Tailwind.

## Install and CSS setup

Install `@combric/react` together with a supported React 19 release:

```sh
npm install @combric/react react react-dom
```

React and React DOM `>=19.0.0 <20` are required peers. Modern ESM tooling and
browsers are supported. The public entry points are `@combric/react` for the
JavaScript and TypeScript API and `@combric/react/css` for styles. Import the
public stylesheet once in your application:

```css
@import "@combric/react/css";
```

That stylesheet imports `@combric/layout/css`, which in turn imports the token
contract, so this is the only required CSS entry point for the standard setup.
Component and layout styles use `var(--combric-*)` semantic properties,
including metriq's square `--combric-radius` geometry.

## Layout

```tsx
import { Card, Container, Grid, Stack } from "@combric/react";

<Container size="wide">
  <Stack gap="6">
    <Grid minItemWidth="md" gap="4">
      <Card>First</Card>
      <Card>Second</Card>
    </Grid>
  </Stack>
</Container>;
```

`Container` supports `prose`, `wide`, and `full`. `Stack` provides vertical
flow. `Inline` is horizontal and non-wrapping, while `Cluster` is horizontal and
wrapping. All four flow primitives use typed Combric gap keys. `Grid` supports
either explicit `columns={1 | 2 | 3 | 4}` or intrinsic
`minItemWidth="sm" | "md" | "lg"`; these modes cannot be combined.

Intrinsic Grid uses native `auto-fit/minmax` responsiveness. There are no
breakpoint props, viewport hooks, resize listeners, or JavaScript geometry
calculations. Native `className` and `style` remain available for exceptional
consumer requirements.

## Button

```tsx
import { Button } from "@combric/react";

<Button variant="primary" size="md" onClick={() => console.log("save")}>
  Save
</Button>;
```

`Button` renders a native `<button>` with a default `type="button"`. Variants
are `primary`, `secondary`, and `ghost`; sizes are `sm`, `md`, and `lg`. Native
button props, React 19 `ref`, and consumer `className` are supported.

## Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@combric/react";

<Card>
  <CardHeader>
    <CardTitle>Project</CardTitle>
    <CardDescription>Current project status.</CardDescription>
  </CardHeader>
  <CardContent>Ready</CardContent>
  <CardFooter>Updated today</CardFooter>
</Card>;
```

The card API is compositional and uses semantic section, heading, paragraph, and
footer elements. Each component accepts its native props, `ref`, and an
additional `className`.

## Accordion

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@combric/react";

<Accordion defaultValue="details">
  <AccordionItem value="details">
    <AccordionTrigger>Details</AccordionTrigger>
    <AccordionContent>Accessible disclosure content.</AccordionContent>
  </AccordionItem>
</Accordion>;
```

Accordion is single-open and supports both uncontrolled `defaultValue` and
controlled `value` with `onValueChange`. A controlled value is authoritative.
Triggers are native buttons, so Enter and Space behavior is inherited from the
platform. Stable IDs connect `aria-controls`, `aria-expanded`, the labelled
content region, and its trigger. A disabled item disables its trigger.

## Form controls

```tsx
import {
  Checkbox,
  Input,
  Label,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  Textarea,
} from "@combric/react";

<Stack gap="3">
  <Label htmlFor="email">Email</Label>
  <Input id="email" name="email" type="email" required />
  <Label htmlFor="notes">Notes</Label>
  <Textarea id="notes" name="notes" />
  <Label>
    <Checkbox name="terms" required /> Accept terms
  </Label>
  <RadioGroup name="plan" defaultValue="starter" aria-label="Plan">
    <Label>
      <Radio value="starter" /> Starter
    </Label>
    <Label>
      <Radio value="pro" /> Pro
    </Label>
  </RadioGroup>
  <Label>
    <Switch name="notifications" /> Notifications
  </Label>
  <Select name="region" defaultValue="eu" aria-label="Region">
    <option value="eu">Europe</option>
    <option value="us">United States</option>
  </Select>
</Stack>;
```

`Label`, `Input`, `Textarea`, `Checkbox`, `Radio`, `Switch`, and `Select` use
native elements and preserve their form, keyboard, disabled, required,
controlled, and uncontrolled behavior. `Input`, `Textarea`, and `Select` accept
`aria-invalid="true"` for invalid styling; Combric does not perform validation.
Textarea keeps normal browser vertical resizing. Checkbox deliberately omits an
indeterminate abstraction in this milestone.

`RadioGroup` uses a native disabled `fieldset`, supplies one name to its native
radio children, and supports `value`/`defaultValue` with `onValueChange`. A
controlled value is authoritative. `Switch` is a form-associated native checkbox
presented with `role="switch"`; it is not a visual `div` substitute. `Select` is
the native control—custom listbox, search, portals, multi-select UI, and popup
positioning are intentionally deferred. All controls accept native props,
`className`, and React 19 refs to their meaningful DOM element.

## Badge and Separator

```tsx
import { Badge, Separator } from "@combric/react";

<Badge variant="accent">Active</Badge>
<Separator />
<Separator decorative />
```

Badge is a non-interactive `span` with only `neutral` and `accent` variants.
Separator is a semantic horizontal `hr`; `decorative` removes separator
semantics and hides it from assistive technology. Vertical separators and
status-tone matrices are intentionally absent.

## Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@combric/react";

<Avatar size="md">
  <AvatarImage src="/ada.png" alt="Ada Lovelace" />
  <AvatarFallback>AL</AvatarFallback>
</Avatar>;
```

Avatar sizes are `sm`, `md`, and `lg`. The required image `alt` text preserves
native image semantics; load/error events deterministically switch the fallback.
The default metriq geometry is square. There is no loader, remote-data API,
presence system, or circular default.

## Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@combric/react";

<Tabs defaultValue="overview">
  <TabsList aria-label="Project sections">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview panel</TabsContent>
  <TabsContent value="activity">Activity panel</TabsContent>
</Tabs>;
```

Tabs supports controlled `value` and uncontrolled `defaultValue`, with
deterministic `onValueChange`. It uses automatic horizontal activation:
ArrowLeft/ArrowRight wrap through enabled tabs, while Home/End select the first
or last enabled tab. Native buttons provide click and focus behavior. Stable IDs
connect `tab`, `tablist`, and `tabpanel` roles with the required ARIA state.
Disabled triggers are skipped. Vertical orientation, manual activation,
reordering, close buttons, overflow menus, and measured animations are deferred.

## Breadcrumb

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@combric/react";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Project</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>;
```

Breadcrumb renders a labelled `nav` and ordered list. Links are native anchors,
separators are presentational, and `BreadcrumbPage` supplies
`aria-current="page"`. It has no router dependency or polymorphic Link contract.

## Pagination

```tsx
import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@combric/react";

<Pagination>
  <PaginationList>
    <PaginationItem>
      <PaginationPrevious disabled />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink current href="?page=1">
        1
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="?page=2" />
    </PaginationItem>
  </PaginationList>
</Pagination>;
```

Pagination is labelled navigation with list and native anchor semantics.
`current` supplies `aria-current="page"`; `disabled` removes `href`, prevents
activation, supplies `aria-disabled`, and removes the link from tab order.
Previous/Next use accessible text and labels without an icon dependency.
Pagination owns no page count, cursor, fetch, query, or router state.

## Dialog

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@combric/react";

<Dialog defaultOpen={false} onOpenChange={(open) => console.log(open)}>
  <DialogTrigger>Open dialog</DialogTrigger>
  <DialogContent>
    <DialogTitle>Confirm change</DialogTitle>
    <DialogDescription>This action updates the project.</DialogDescription>
    <DialogClose>Cancel</DialogClose>
  </DialogContent>
</Dialog>;
```

Dialog supports controlled `open` and uncontrolled `defaultOpen`. Content is
portaled to `document.body` by default; `container` selects an explicit portal
parent. It uses modal dialog semantics, isolates background siblings, moves
focus into the content, cycles Tab and Shift+Tab, closes on Escape or backdrop
pointer interaction, and restores focus to the trigger. Consumer handlers run
first and may prevent trigger, close, or backdrop behavior. Include
`DialogTitle` for the accessible name and `DialogDescription` for the default
description relationship, or supply explicit ARIA naming props to content.

## Drawer / Sheet

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@combric/react";

<Drawer>
  <DrawerTrigger>Filters</DrawerTrigger>
  <DrawerContent side="right">
    <DrawerTitle>Filters</DrawerTitle>
    <DrawerDescription>Limit the visible results.</DrawerDescription>
    <DrawerClose>Done</DrawerClose>
  </DrawerContent>
</Drawer>;
```

Drawer reuses Dialog's modal, portal, focus, dismissal, isolation, and
controlled-state mechanics. Its deliberately small visual contract supports only
`left` and `right`. `Sheet`, `SheetTrigger`, `SheetContent`, `SheetTitle`,
`SheetDescription`, and `SheetClose` are exact naming aliases, not a second
implementation. There is no animation framework or nested-modal orchestrator.

## Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@combric/react";

<DropdownMenu>
  <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
  <DropdownMenuContent side="bottom" align="start">
    <DropdownMenuItem onSelect={() => edit()}>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem disabled>Archive</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

Dropdown Menu implements the ARIA menu/menuitem contract. ArrowDown and ArrowUp
wrap through enabled items; Home and End move to the boundaries; Enter/Space
activate; Escape restores focus; Tab closes from the trigger position. Selection
closes unless the consumer prevents the event. Pointer interaction outside
dismisses without stealing the new focus owner. Content is portaled and
positioned relative to the trigger with `top`, `right`, `bottom`, or `left` side
and `start`, `center`, or `end` alignment. Collision handling flips and clamps
to the viewport. Submenus, checkbox/radio items, menubars, and typeahead are
intentionally absent.

## Popover

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@combric/react";

<Popover>
  <PopoverTrigger>Details</PopoverTrigger>
  <PopoverContent side="bottom" align="start">
    Non-modal details
  </PopoverContent>
</Popover>;
```

Popover follows the same controlled/uncontrolled and anchored-positioning
contracts, but remains non-modal: it does not isolate the background, move
focus, or trap focus. Escape closes and restores trigger focus. Pointer
interaction outside closes without overriding the consumer's new focus.

## Tooltip

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@combric/react";

<Tooltip>
  <TooltipTrigger>Help</TooltipTrigger>
  <TooltipContent>Keyboard shortcut: Ctrl+K</TooltipContent>
</Tooltip>;
```

Tooltip opens for pointer hover or keyboard focus, connects content through
`aria-describedby`, closes on leave/blur/Escape, and never moves focus. Content
uses `role="tooltip"`, is portaled and positioned, and must remain
non-interactive. Display is immediate; a provider and delay system are omitted
until a concrete cross-tooltip timing requirement exists.

## Toast

```tsx
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "@combric/react";

<ToastViewport aria-label="Notifications">
  <Toast duration={5000}>
    <ToastTitle>Saved</ToastTitle>
    <ToastDescription>Your changes are available.</ToastDescription>
    <ToastClose>Dismiss</ToastClose>
  </Toast>
</ToastViewport>;
```

The viewport is a portaled notification region and supports multiple
compositional Toast children. Each Toast supports controlled `open`,
uncontrolled `defaultOpen`, deterministic `onOpenChange`, optional `duration`
(`0` disables timeout), and an accessible close button. `priority="polite"` uses
status semantics; `assertive` uses alert semantics. Timers are cleaned up on
close and unmount. Toasts never move focus. There is intentionally no global
store, imperative service, swipe system, or application notification backend.

## Field composition

```tsx
import {
  Field,
  FieldDescription,
  FieldMessage,
  Input,
  Label,
} from "@combric/react";

<Field invalid>
  <Label>Email</Label>
  <Input name="email" />
  <FieldDescription>Use your work address.</FieldDescription>
  <FieldMessage>Enter a valid email address.</FieldMessage>
</Field>;
```

`Field` supplies stable control, label, description, and message IDs to its
Combric descendants. `invalid` is consumer-owned validation state: it gives the
control `aria-invalid` and associates a mounted message through
`aria-describedby`; Combric does not validate or manage values. Mounted
description and message relationships are composed with consumer-provided
`aria-describedby` tokens. Unmounted content leaves no dangling reference.
`FieldMessage` is ordinary text by default, not an automatic live region.

`Fieldset` and `FieldLegend` style native `<fieldset>` and `<legend>` elements,
including native disabled propagation. `InputGroup` is a visual composition
container for an existing control plus prefixes, suffixes, or independently
focusable actions; decorative content should use `aria-hidden="true"` and the
group does not replace the control's accessible label.

## Slider

```tsx
import { Field, Label, Slider } from "@combric/react";

<Field>
  <Label>Volume</Label>
  <Slider name="volume" min={0} max={100} defaultValue={50} />
</Field>;
```

Slider is a native horizontal `<input type="range">`. It preserves browser form
participation, validation, keyboard behavior, controlled and uncontrolled value
props, and disabled behavior. The stylesheet covers the WebKit and Gecko range
track/thumb pseudo-elements available to standard CSS, but exact native
rendering remains browser-dependent. Multi-thumb ranges, marks, vertical
orientation, and tooltips are outside this contract.

## Toggle and ToggleGroup

```tsx
import { Toggle, ToggleGroup, ToggleGroupItem } from "@combric/react";

<Toggle defaultPressed onPressedChange={(pressed) => savePin(pressed)}>
  Pin
</Toggle>

<ToggleGroup type="single" defaultValue="list" aria-label="View">
  <ToggleGroupItem value="list">List</ToggleGroupItem>
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
</ToggleGroup>;
```

Toggle is a native button with `aria-pressed`; it defaults to `type="button"`
and supports `pressed`, `defaultPressed`, and `onPressedChange`. It represents a
pressed tool or view state. Checkbox represents a form choice and Switch
represents an immediate on/off setting, so neither is interchangeable with
Toggle.

ToggleGroup supports `type="single"` with string state and `type="multiple"`
with string-array state. Both modes support controlled `value`, uncontrolled
`defaultValue`, `onValueChange`, disabled groups/items, and horizontal or
vertical orientation. Arrow keys move focus according to orientation; Home and
End move to boundaries; disabled items are skipped. Focus movement does not
select an item. ToggleGroup is a pressable tool-state group, not a replacement
for RadioGroup when a mutually exclusive native form value is required.

## Feedback and async state

```tsx
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
  Skeleton,
  Spinner,
} from "@combric/react";

<Alert tone="error">
  <AlertTitle>Import failed</AlertTitle>
  <AlertDescription>Check the source file and try again.</AlertDescription>
</Alert>
<Progress aria-label="Import progress" value={60} max={100} />
<Spinner aria-label="Refreshing projects" />
<Skeleton aria-hidden="true" />;
```

Alert is static section content by default. `live="polite"` creates status
semantics and `live="assertive"` creates alert semantics only when a consumer
explicitly needs announcement. The deliberately small visual tone set is
`neutral | error`, using canonical colors.

Progress is native `<progress>`: provide `value` for determinate completion and
omit it for indeterminate progress. Spinner is a compact indeterminate busy
indicator, decorative by default; an explicit `aria-label` gives it status
semantics without injecting untranslated text. Progress communicates measurable
completion, while Spinner communicates activity without a completion value.
Skeleton is a visual placeholder, hidden from assistive technology by default,
and never claims progress semantics. Spinner and Skeleton animations stop under
`prefers-reduced-motion: reduce`.

## EmptyState

```tsx
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateMedia,
  EmptyStateTitle,
} from "@combric/react";

<EmptyState>
  <EmptyStateMedia aria-hidden="true">+</EmptyStateMedia>
  <EmptyStateTitle level={3}>No projects</EmptyStateTitle>
  <EmptyStateDescription>Create a project to begin.</EmptyStateDescription>
  <EmptyStateActions>
    <Button>Create project</Button>
  </EmptyStateActions>
</EmptyState>;
```

EmptyState structures consumer-owned media, title, description, and actions. The
title level is selectable from `2` through `6` so consumers preserve their
document outline. It owns no fetching, retry, routing, or application state.

## Collapsible

```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@combric/react";

<Collapsible defaultOpen>
  <CollapsibleTrigger>Technical details</CollapsibleTrigger>
  <CollapsibleContent>Package-first component catalogue.</CollapsibleContent>
</Collapsible>;
```

Collapsible supports controlled `open`, uncontrolled `defaultOpen`,
`onOpenChange`, and disabled state. Its native button trigger supplies stable
`aria-expanded` and `aria-controls` relationships to the labelled content
region. Consumer click handlers run first and may prevent the state change.

## Table and DescriptionList

```tsx
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@combric/react";

<TableContainer aria-label="Project inventory">
  <Table>
    <TableCaption>Current projects</TableCaption>
    <TableHeader><TableRow><TableHead>Project</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableCell>Catalogue</TableCell></TableRow></TableBody>
  </Table>
</TableContainer>

<DescriptionList>
  <DescriptionTerm>Runtime</DescriptionTerm>
  <DescriptionDetails>React 19</DescriptionDetails>
</DescriptionList>;
```

The Table family renders native table elements; `TableHead` defaults to
`scope="col"`. `TableContainer` provides a keyboard-focusable horizontal
overflow boundary while preserving the table, so give the container an
accessible label that identifies the scrollable content. Table is not a Data
Grid: it owns no sorting, filtering, selection, pagination, editing, resizing,
fetching, or virtualization. DescriptionList, DescriptionTerm, and
DescriptionDetails are direct `<dl>`, `<dt>`, and `<dd>` wrappers.

Native Select remains Combric's 1.0 selection contract. The catalogue does not
include a custom listbox Select, Combobox, or selection popup framework.

## Overlay architecture and browser contract

Portal hosts are created only in effects, so importing or server-rendering the
package does not access browser globals during module evaluation or unsafe
render paths. Stable React IDs provide trigger/content and accessible-name
relationships. A narrow internal active-layer stack ensures Escape and outside
interaction affect only the top active overlay. It is not exported as a general
overlay engine.

Anchored content uses fixed viewport coordinates, canonical spacing for its
offset, and deterministic side flipping and viewport clamping on open, scroll,
and resize. Unit tests verify the DOM and coordinate contract with mocked
rectangles; they do not claim pixel geometry, clipping, stacking contexts, or
visual animation in a real browser. Custom portal containers that establish a
transformed containing block remain subject to normal browser fixed-position
rules.

## Scope

The public API intentionally has no polymorphic `as`/`asChild` contract, variant
engine, form framework, router integration, public generalized overlay engine,
responsive object DSL, layout solver, multiple-open accordion mode, animation
framework, component-specific token layer, or runtime theme system. Consumer
classes extend rather than replace required Combric classes. Additional
components, docs/playground, and generators remain future work.

## Project and license

Source and full documentation:
[Combric/combric](https://github.com/Combric/combric). Licensed under the
[MIT License](../../LICENSE).

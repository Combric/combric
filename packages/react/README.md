# @combric/react

Accessible React 19 component primitives styled with the canonical Combric
design-token contract. The package does not require Tailwind.

## Install and CSS setup

Install `@combric/react` together with a supported React 19 release. Import the
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

## Scope

The public API intentionally has no polymorphic `as`/`asChild` contract, variant
engine, form framework, router integration, portal or positioning subsystem,
responsive object DSL, layout solver, multiple-open accordion mode, measured
animations, component-specific token layer, or runtime theme system. Consumer
classes extend rather than replace required Combric classes. Additional
components, docs/playground, and generators remain future work.

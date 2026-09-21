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

## Scope

The public API intentionally has no polymorphic `as`/`asChild` contract, variant
engine, responsive object DSL, layout solver, multiple-open accordion mode,
measured animations, component-specific token layer, or runtime theme system.
Consumer classes extend rather than replace required Combric classes. Additional
components, docs/playground, and generators remain future work.

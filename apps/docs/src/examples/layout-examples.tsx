import { Cluster, Container, Grid, Inline, Stack } from "@combric/react";
import type { ComponentType } from "react";

export const layoutExamples: Readonly<
  Record<string, { Component: ComponentType; source: string }>
> = {
  container: {
    Component: () => (
      <Container size="prose">A readable prose-width container.</Container>
    ),
    source: `import { Container } from "@combric/react";

export function Example() {
  return <Container size="prose">A readable prose-width container.</Container>;
}`,
  },
  stack: {
    Component: () => (
      <Stack gap="3">
        <ButtonLike>First</ButtonLike>
        <ButtonLike>Second</ButtonLike>
      </Stack>
    ),
    source: `import { Stack } from "@combric/react";

export function Example() {
  return <Stack gap="3"><div>First</div><div>Second</div></Stack>;
}`,
  },
  inline: {
    Component: () => (
      <Inline gap="3" align="baseline">
        <strong>Project</strong>
        <span>Ready</span>
      </Inline>
    ),
    source: `import { Inline } from "@combric/react";

export function Example() {
  return <Inline gap="3" align="baseline"><strong>Project</strong><span>Ready</span></Inline>;
}`,
  },
  cluster: {
    Component: () => (
      <Cluster gap="2">
        <ButtonLike>Save</ButtonLike>
        <ButtonLike>Cancel</ButtonLike>
        <ButtonLike>Preview</ButtonLike>
      </Cluster>
    ),
    source: `import { Cluster } from "@combric/react";

export function Example() {
  return <Cluster gap="2"><button>Save</button><button>Cancel</button><button>Preview</button></Cluster>;
}`,
  },
  grid: {
    Component: () => (
      <Grid minItemWidth="sm" gap="3">
        <ButtonLike>First</ButtonLike>
        <ButtonLike>Second</ButtonLike>
        <ButtonLike>Third</ButtonLike>
      </Grid>
    ),
    source: `import { Grid } from "@combric/react";

export function Example() {
  return <Grid minItemWidth="sm" gap="3"><article>First</article><article>Second</article><article>Third</article></Grid>;
}`,
  },
};

function ButtonLike({ children }: { readonly children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--combric-color-border)",
        padding: "var(--combric-space-2)",
      }}
    >
      {children}
    </div>
  );
}

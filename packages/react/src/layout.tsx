import type { HTMLAttributes, ReactElement, Ref } from "react";

import { classNames } from "./class-names.js";

export type LayoutGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "12" | "16";
export type LayoutAlignment = "start" | "center" | "end" | "baseline";
export type ContainerSize = "prose" | "wide" | "full";
export type GridColumns = 1 | 2 | 3 | 4;
export type GridMinItemWidth = "sm" | "md" | "lg";

const layoutGaps: readonly LayoutGap[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "6",
  "8",
  "12",
  "16",
];
const layoutAlignments: readonly LayoutAlignment[] = [
  "start",
  "center",
  "end",
  "baseline",
];
const containerSizes: readonly ContainerSize[] = ["prose", "wide", "full"];
const gridColumns: readonly GridColumns[] = [1, 2, 3, 4];
const gridMinItemWidths: readonly GridMinItemWidth[] = ["sm", "md", "lg"];

function assertOption<Value extends string | number>(
  name: string,
  value: unknown,
  allowed: readonly Value[],
): asserts value is Value {
  if (!allowed.includes(value as Value)) {
    throw new RangeError(
      `${name} must be one of: ${allowed.map(String).join(", ")}.`,
    );
  }
}

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  size?: ContainerSize;
}

export function Container({
  className,
  ref,
  size = "wide",
  ...props
}: ContainerProps): ReactElement {
  assertOption("Container size", size, containerSizes);

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-container", className)}
      data-size={size}
    />
  );
}

interface GapLayoutProps extends HTMLAttributes<HTMLDivElement> {
  gap?: LayoutGap;
  ref?: Ref<HTMLDivElement>;
}

export type StackProps = GapLayoutProps;

export function Stack({
  className,
  gap = "4",
  ref,
  ...props
}: StackProps): ReactElement {
  assertOption("Stack gap", gap, layoutGaps);

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-stack", className)}
      data-gap={gap}
    />
  );
}

interface FlowLayoutProps extends GapLayoutProps {
  align?: LayoutAlignment;
}

export type InlineProps = FlowLayoutProps;

export function Inline({
  align = "center",
  className,
  gap = "4",
  ref,
  ...props
}: InlineProps): ReactElement {
  assertOption("Inline alignment", align, layoutAlignments);
  assertOption("Inline gap", gap, layoutGaps);

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-inline", className)}
      data-align={align}
      data-gap={gap}
    />
  );
}

export type ClusterProps = FlowLayoutProps;

export function Cluster({
  align = "center",
  className,
  gap = "4",
  ref,
  ...props
}: ClusterProps): ReactElement {
  assertOption("Cluster alignment", align, layoutAlignments);
  assertOption("Cluster gap", gap, layoutGaps);

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-cluster", className)}
      data-align={align}
      data-gap={gap}
    />
  );
}

type GridBaseProps = GapLayoutProps;

interface ExplicitGridProps {
  columns: GridColumns;
  minItemWidth?: never;
}

interface IntrinsicGridProps {
  columns?: never;
  minItemWidth?: GridMinItemWidth;
}

export type GridProps = GridBaseProps &
  (ExplicitGridProps | IntrinsicGridProps);

export function Grid({
  className,
  columns,
  gap = "4",
  minItemWidth,
  ref,
  ...props
}: GridProps): ReactElement {
  assertOption("Grid gap", gap, layoutGaps);
  if (columns !== undefined) {
    assertOption("Grid columns", columns, gridColumns);
    if (minItemWidth !== undefined) {
      throw new TypeError(
        "Grid columns and minItemWidth cannot be used together.",
      );
    }
  } else {
    assertOption("Grid minItemWidth", minItemWidth ?? "md", gridMinItemWidths);
  }

  const resolvedMinItemWidth: GridMinItemWidth = minItemWidth ?? "md";

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-grid", className)}
      data-columns={columns}
      data-gap={gap}
      data-min-item-width={
        columns === undefined ? resolvedMinItemWidth : undefined
      }
    />
  );
}

import {
  createElement,
  type HTMLAttributes,
  type ProgressHTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";

export type AlertTone = "error" | "neutral";
export type AlertLive = "assertive" | "polite";

export interface AlertProps extends HTMLAttributes<HTMLElement> {
  live?: AlertLive;
  ref?: Ref<HTMLElement>;
  tone?: AlertTone;
}

export function Alert({
  "aria-live": ariaLive,
  className,
  live,
  ref,
  role,
  tone = "neutral",
  ...props
}: AlertProps): ReactElement {
  return (
    <section
      {...props}
      ref={ref}
      role={
        role ?? (live === "assertive" ? "alert" : live ? "status" : undefined)
      }
      aria-live={ariaLive ?? live}
      className={classNames("combric-alert", className)}
      data-tone={tone}
    />
  );
}

export interface AlertTitleProps extends HTMLAttributes<HTMLSpanElement> {
  ref?: Ref<HTMLSpanElement>;
}

export function AlertTitle({
  className,
  ref,
  ...props
}: AlertTitleProps): ReactElement {
  return (
    <span
      {...props}
      ref={ref}
      className={classNames("combric-alert__title", className)}
    />
  );
}

export interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function AlertDescription({
  className,
  ref,
  ...props
}: AlertDescriptionProps): ReactElement {
  return (
    <p
      {...props}
      ref={ref}
      className={classNames("combric-alert__description", className)}
    />
  );
}

export interface ProgressProps extends ProgressHTMLAttributes<HTMLProgressElement> {
  ref?: Ref<HTMLProgressElement>;
}

export function Progress({
  className,
  max = 100,
  ref,
  value,
  ...props
}: ProgressProps): ReactElement {
  return (
    <progress
      {...props}
      ref={ref}
      className={classNames("combric-progress", className)}
      data-state={value === undefined ? "indeterminate" : "determinate"}
      max={max}
      value={value}
    />
  );
}

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  ref?: Ref<HTMLSpanElement>;
}

export function Spinner({
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  className,
  ref,
  role,
  ...props
}: SpinnerProps): ReactElement {
  const named = Boolean(ariaLabel);
  return (
    <span
      {...props}
      ref={ref}
      role={role ?? (named ? "status" : undefined)}
      aria-hidden={ariaHidden ?? (named ? undefined : true)}
      aria-label={ariaLabel}
      className={classNames("combric-spinner", className)}
    />
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function Skeleton({
  "aria-hidden": ariaHidden = true,
  className,
  ref,
  ...props
}: SkeletonProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      aria-hidden={ariaHidden}
      className={classNames("combric-skeleton", className)}
    />
  );
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function EmptyState({
  className,
  ref,
  ...props
}: EmptyStateProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-empty-state", className)}
    />
  );
}

export interface EmptyStateMediaProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function EmptyStateMedia({
  className,
  ref,
  ...props
}: EmptyStateMediaProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-empty-state__media", className)}
    />
  );
}

export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface EmptyStateTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: EmptyStateHeadingLevel;
  ref?: Ref<HTMLHeadingElement>;
}

function headingTag(
  level: EmptyStateHeadingLevel,
): "h2" | "h3" | "h4" | "h5" | "h6" {
  switch (level) {
    case 3:
      return "h3";
    case 4:
      return "h4";
    case 5:
      return "h5";
    case 6:
      return "h6";
    default:
      return "h2";
  }
}

export function EmptyStateTitle({
  className,
  level = 2,
  ref,
  ...props
}: EmptyStateTitleProps): ReactElement {
  return createElement(headingTag(level), {
    ...props,
    className: classNames("combric-empty-state__title", className),
    ref,
  });
}

export interface EmptyStateDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function EmptyStateDescription({
  className,
  ref,
  ...props
}: EmptyStateDescriptionProps): ReactElement {
  return (
    <p
      {...props}
      ref={ref}
      className={classNames("combric-empty-state__description", className)}
    />
  );
}

export interface EmptyStateActionsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function EmptyStateActions({
  className,
  ref,
  ...props
}: EmptyStateActionsProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-empty-state__actions", className)}
    />
  );
}

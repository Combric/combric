import type { HTMLAttributes, ReactElement, Ref } from "react";

import { classNames } from "./class-names.js";

export type BadgeVariant = "neutral" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  ref?: Ref<HTMLSpanElement>;
  variant?: BadgeVariant;
}

export function Badge({
  className,
  ref,
  variant = "neutral",
  ...props
}: BadgeProps): ReactElement {
  if (variant !== "neutral" && variant !== "accent") {
    throw new RangeError("Badge variant must be neutral or accent.");
  }

  return (
    <span
      {...props}
      ref={ref}
      className={classNames("combric-badge", className)}
      data-variant={variant}
    />
  );
}

export interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  decorative?: boolean;
  ref?: Ref<HTMLHRElement>;
}

export function Separator({
  className,
  decorative = false,
  ref,
  ...props
}: SeparatorProps): ReactElement {
  return (
    <hr
      {...props}
      ref={ref}
      aria-hidden={decorative || undefined}
      className={classNames("combric-separator", className)}
      role={decorative ? "none" : undefined}
    />
  );
}

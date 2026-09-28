import type { HTMLAttributes, ReactElement, Ref } from "react";

import { classNames } from "./class-names.js";
import { renderIconSlot, type IconSlot } from "./icon-slots.js";

export type BadgeVariant = "neutral" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  leadingIcon?: IconSlot;
  ref?: Ref<HTMLSpanElement>;
  trailingIcon?: IconSlot;
  variant?: BadgeVariant;
}

export function Badge({
  className,
  leadingIcon,
  ref,
  trailingIcon,
  variant = "neutral",
  children,
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
    >
      {renderIconSlot(leadingIcon, "leading")}
      {children}
      {renderIconSlot(trailingIcon, "trailing")}
    </span>
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

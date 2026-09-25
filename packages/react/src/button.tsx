import type { ButtonHTMLAttributes, ReactElement, Ref } from "react";

import { classNames } from "./class-names.js";
import type { RadiusPreset } from "./radius.js";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "accent" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size"
> {
  ref?: Ref<HTMLButtonElement>;
  radius?: RadiusPreset;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  className,
  radius,
  ref,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classNames("combric-button", className)}
      data-size={size}
      data-variant={variant}
      data-radius={radius}
    />
  );
}

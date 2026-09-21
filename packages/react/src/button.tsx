import type { ButtonHTMLAttributes, ReactElement, Ref } from "react";

import { classNames } from "./class-names.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size"
> {
  ref?: Ref<HTMLButtonElement>;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  className,
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
    />
  );
}

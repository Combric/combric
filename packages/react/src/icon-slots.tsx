import type { ReactElement, ReactNode } from "react";

import { classNames } from "./class-names.js";

export type IconSlot = ReactNode;

export type IconSlotPosition = "leading" | "trailing" | "icon";

export interface IconSlotProps {
  leadingIcon?: IconSlot;
  trailingIcon?: IconSlot;
}

export function hasIconSlot(icon: IconSlot): boolean {
  return icon !== null && icon !== undefined && icon !== false;
}

export function renderIconSlot(
  icon: IconSlot,
  position: IconSlotPosition,
): ReactElement | null {
  if (!hasIconSlot(icon)) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={classNames(
        "combric-icon-slot",
        `combric-icon-slot--${position}`,
      )}
    >
      {icon}
    </span>
  );
}

export function renderIconSlotContent(
  children: ReactNode,
  ...icons: IconSlot[]
): ReactNode {
  return icons.some(hasIconSlot) ? (
    <span className="combric-icon-slot__content">{children}</span>
  ) : (
    children
  );
}

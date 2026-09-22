"use client";

import type { ReactElement } from "react";

import {
  ModalCloseBase,
  ModalDescriptionBase,
  ModalRootBase,
  ModalSurfaceBase,
  ModalTitleBase,
  ModalTriggerBase,
  type ModalCloseBaseProps,
  type ModalDescriptionBaseProps,
  type ModalRootBaseProps,
  type ModalSurfaceBaseProps,
  type ModalTitleBaseProps,
  type ModalTriggerBaseProps,
} from "./modal-internals.js";

const componentName = "Drawer";

export type DrawerSide = "left" | "right";

export type DrawerProps = Omit<ModalRootBaseProps, "componentName">;

export function Drawer(props: DrawerProps): ReactElement {
  return <ModalRootBase {...props} componentName={componentName} />;
}

export type DrawerTriggerProps = Omit<
  ModalTriggerBaseProps,
  "classNameBase" | "componentName"
>;

export function DrawerTrigger(props: DrawerTriggerProps): ReactElement {
  return (
    <ModalTriggerBase
      {...props}
      classNameBase="combric-drawer__trigger"
      componentName={componentName}
    />
  );
}

export interface DrawerContentProps extends Omit<
  ModalSurfaceBaseProps,
  "backdropClassName" | "classNameBase" | "componentName"
> {
  side?: DrawerSide;
}

export function DrawerContent({
  side = "right",
  ...props
}: DrawerContentProps): ReactElement | null {
  return (
    <ModalSurfaceBase
      {...props}
      backdropClassName="combric-drawer__backdrop"
      classNameBase="combric-drawer__content"
      componentName={componentName}
      data-side={side}
    />
  );
}

export type DrawerTitleProps = Omit<
  ModalTitleBaseProps,
  "classNameBase" | "componentName"
>;

export function DrawerTitle(props: DrawerTitleProps): ReactElement {
  return (
    <ModalTitleBase
      {...props}
      classNameBase="combric-drawer__title"
      componentName={componentName}
    />
  );
}

export type DrawerDescriptionProps = Omit<
  ModalDescriptionBaseProps,
  "classNameBase" | "componentName"
>;

export function DrawerDescription(props: DrawerDescriptionProps): ReactElement {
  return (
    <ModalDescriptionBase
      {...props}
      classNameBase="combric-drawer__description"
      componentName={componentName}
    />
  );
}

export type DrawerCloseProps = Omit<
  ModalCloseBaseProps,
  "classNameBase" | "componentName"
>;

export function DrawerClose(props: DrawerCloseProps): ReactElement {
  return (
    <ModalCloseBase
      {...props}
      classNameBase="combric-drawer__close"
      componentName={componentName}
    />
  );
}

export const Sheet: typeof Drawer = Drawer;
export const SheetTrigger: typeof DrawerTrigger = DrawerTrigger;
export const SheetContent: typeof DrawerContent = DrawerContent;
export const SheetTitle: typeof DrawerTitle = DrawerTitle;
export const SheetDescription: typeof DrawerDescription = DrawerDescription;
export const SheetClose: typeof DrawerClose = DrawerClose;

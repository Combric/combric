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

const componentName = "Dialog";

export type DialogProps = Omit<ModalRootBaseProps, "componentName">;

export function Dialog(props: DialogProps): ReactElement {
  return <ModalRootBase {...props} componentName={componentName} />;
}

export type DialogTriggerProps = Omit<
  ModalTriggerBaseProps,
  "classNameBase" | "componentName"
>;

export function DialogTrigger(props: DialogTriggerProps): ReactElement {
  return (
    <ModalTriggerBase
      {...props}
      classNameBase="combric-dialog__trigger"
      componentName={componentName}
    />
  );
}

export type DialogContentProps = Omit<
  ModalSurfaceBaseProps,
  "backdropClassName" | "classNameBase" | "componentName"
>;

export function DialogContent(props: DialogContentProps): ReactElement | null {
  return (
    <ModalSurfaceBase
      {...props}
      backdropClassName="combric-dialog__backdrop"
      classNameBase="combric-dialog__content"
      componentName={componentName}
    />
  );
}

export type DialogTitleProps = Omit<
  ModalTitleBaseProps,
  "classNameBase" | "componentName"
>;

export function DialogTitle(props: DialogTitleProps): ReactElement {
  return (
    <ModalTitleBase
      {...props}
      classNameBase="combric-dialog__title"
      componentName={componentName}
    />
  );
}

export type DialogDescriptionProps = Omit<
  ModalDescriptionBaseProps,
  "classNameBase" | "componentName"
>;

export function DialogDescription(props: DialogDescriptionProps): ReactElement {
  return (
    <ModalDescriptionBase
      {...props}
      classNameBase="combric-dialog__description"
      componentName={componentName}
    />
  );
}

export type DialogCloseProps = Omit<
  ModalCloseBaseProps,
  "classNameBase" | "componentName"
>;

export function DialogClose(props: DialogCloseProps): ReactElement {
  return (
    <ModalCloseBase
      {...props}
      classNameBase="combric-dialog__close"
      componentName={componentName}
    />
  );
}

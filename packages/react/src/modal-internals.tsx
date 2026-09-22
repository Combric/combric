"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type PointerEvent,
  type PointerEventHandler,
  type PropsWithChildren,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";
import {
  mergeRefs,
  renderPortal,
  useControllableOpen,
  useFocusRestoration,
  useFocusTrap,
  useLayer,
  useModalIsolation,
  usePortalHost,
} from "./overlay-internals.js";

interface ModalContextValue {
  contentId: string;
  descriptionId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(componentName: string): ModalContextValue {
  const context = useContext(ModalContext);
  if (context === null) {
    throw new Error(`${componentName} must be nested inside its modal root.`);
  }
  return context;
}

export interface ModalRootBaseProps extends PropsWithChildren {
  componentName: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function ModalRootBase({
  children,
  componentName,
  defaultOpen,
  onOpenChange,
  open: openProp,
}: ModalRootBaseProps): ReactElement {
  const [open, setOpen] = useControllableOpen({
    componentName,
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const baseId = `${componentName.toLowerCase()}-${useId().replaceAll(":", "")}`;

  useFocusRestoration(open, triggerRef);

  return (
    <ModalContext.Provider
      value={{
        contentId: `${baseId}-content`,
        descriptionId: `${baseId}-description`,
        open,
        setOpen,
        titleId: `${baseId}-title`,
        triggerRef,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export interface ModalTriggerBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  classNameBase: string;
  componentName: string;
  ref?: Ref<HTMLButtonElement>;
}

export function ModalTriggerBase({
  className,
  classNameBase,
  componentName,
  disabled,
  onClick,
  ref,
  type = "button",
  ...props
}: ModalTriggerBaseProps): ReactElement {
  const context = useModalContext(componentName);

  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      aria-haspopup="dialog"
      className={classNames(classNameBase, className)}
      data-state={context.open ? "open" : "closed"}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.setOpen(!context.open);
        }
      }}
    />
  );
}

export interface ModalSurfaceBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  backdropClassName: string;
  classNameBase: string;
  componentName: string;
  container?: HTMLElement | null;
  onBackdropPointerDown?: PointerEventHandler<HTMLDivElement>;
  ref?: Ref<HTMLDivElement>;
}

export function ModalSurfaceBase({
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  backdropClassName,
  className,
  classNameBase,
  componentName,
  container,
  onBackdropPointerDown,
  ref,
  ...props
}: ModalSurfaceBaseProps): ReactElement | null {
  const context = useModalContext(componentName);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const host = usePortalHost(container);
  const layerId = useLayer(context.open);
  const close = useCallback(() => context.setOpen(false), [context]);

  useModalIsolation(host, context.open);
  useFocusTrap({
    active: context.open,
    contentRef,
    layerId,
    onEscape: close,
    readyDependency: host,
  });

  if (!context.open) {
    return null;
  }

  return renderPortal(
    <div className="combric-modal-layer" data-layer={layerId}>
      <div
        className={backdropClassName}
        data-state="open"
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          onBackdropPointerDown?.(event);
          if (!event.defaultPrevented && event.target === event.currentTarget) {
            context.setOpen(false);
          }
        }}
      />
      <div
        {...props}
        ref={mergeRefs(contentRef, ref)}
        id={context.contentId}
        role="dialog"
        aria-describedby={ariaDescribedBy ?? context.descriptionId}
        aria-label={ariaLabel}
        aria-labelledby={
          ariaLabel === undefined
            ? (ariaLabelledBy ?? context.titleId)
            : ariaLabelledBy
        }
        aria-modal="true"
        className={classNames(classNameBase, className)}
        data-state="open"
        tabIndex={-1}
      />
    </div>,
    host,
  );
}

export interface ModalTitleBaseProps extends Omit<
  HTMLAttributes<HTMLHeadingElement>,
  "id"
> {
  classNameBase: string;
  componentName: string;
  ref?: Ref<HTMLHeadingElement>;
}

export function ModalTitleBase({
  className,
  classNameBase,
  componentName,
  ref,
  ...props
}: ModalTitleBaseProps): ReactElement {
  const context = useModalContext(componentName);
  return (
    <h2
      {...props}
      ref={ref}
      id={context.titleId}
      className={classNames(classNameBase, className)}
    />
  );
}

export interface ModalDescriptionBaseProps extends Omit<
  HTMLAttributes<HTMLParagraphElement>,
  "id"
> {
  classNameBase: string;
  componentName: string;
  ref?: Ref<HTMLParagraphElement>;
}

export function ModalDescriptionBase({
  className,
  classNameBase,
  componentName,
  ref,
  ...props
}: ModalDescriptionBaseProps): ReactElement {
  const context = useModalContext(componentName);
  return (
    <p
      {...props}
      ref={ref}
      id={context.descriptionId}
      className={classNames(classNameBase, className)}
    />
  );
}

export interface ModalCloseBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  classNameBase: string;
  componentName: string;
  ref?: Ref<HTMLButtonElement>;
}

export function ModalCloseBase({
  className,
  classNameBase,
  componentName,
  onClick,
  ref,
  type = "button",
  ...props
}: ModalCloseBaseProps): ReactElement {
  const context = useModalContext(componentName);
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classNames(classNameBase, className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.setOpen(false);
        }
      }}
    />
  );
}

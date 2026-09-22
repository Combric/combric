"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";
import {
  renderPortal,
  useControllableOpen,
  usePortalHost,
} from "./overlay-internals.js";

interface ToastContextValue {
  close: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error("ToastClose must be nested inside Toast.");
  }
  return context;
}

export interface ToastViewportProps extends HTMLAttributes<HTMLOListElement> {
  container?: HTMLElement | null;
  ref?: Ref<HTMLOListElement>;
}

export function ToastViewport({
  "aria-label": ariaLabel = "Notifications",
  className,
  container,
  ref,
  ...props
}: ToastViewportProps): ReactElement | null {
  const host = usePortalHost(container);
  return renderPortal(
    <ol
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      role="region"
      className={classNames("combric-toast-viewport", className)}
    />,
    host,
  );
}

export type ToastPriority = "assertive" | "polite";

export interface ToastProps extends Omit<
  LiHTMLAttributes<HTMLLIElement>,
  "aria-live" | "role"
> {
  defaultOpen?: boolean;
  duration?: number;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  priority?: ToastPriority;
  ref?: Ref<HTMLLIElement>;
}

export function Toast({
  className,
  defaultOpen = true,
  duration = 5000,
  onOpenChange,
  open: openProp,
  priority = "polite",
  ref,
  ...props
}: ToastProps): ReactElement | null {
  const [open, setOpen] = useControllableOpen({
    componentName: "Toast",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });

  useEffect(() => {
    if (!open || duration <= 0) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setOpen(false), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <ToastContext.Provider value={{ close: () => setOpen(false) }}>
      <li
        {...props}
        ref={ref}
        role={priority === "assertive" ? "alert" : "status"}
        aria-live={priority}
        aria-atomic="true"
        className={classNames("combric-toast", className)}
        data-priority={priority}
        data-state="open"
      />
    </ToastContext.Provider>
  );
}

export interface ToastTitleProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function ToastTitle({
  className,
  ref,
  ...props
}: ToastTitleProps): ReactElement {
  return (
    <strong
      {...props}
      ref={ref}
      className={classNames("combric-toast__title", className)}
    />
  );
}

export interface ToastDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function ToastDescription({
  className,
  ref,
  ...props
}: ToastDescriptionProps): ReactElement {
  return (
    <p
      {...props}
      ref={ref}
      className={classNames("combric-toast__description", className)}
    />
  );
}

export interface ToastCloseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

export function ToastClose({
  className,
  onClick,
  ref,
  type = "button",
  ...props
}: ToastCloseProps): ReactElement {
  const context = useToastContext();
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classNames("combric-toast__close", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.close();
        }
      }}
    />
  );
}

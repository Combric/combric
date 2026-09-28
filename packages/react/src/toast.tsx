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
import { renderIconSlot, type IconSlot } from "./icon-slots.js";
import { mergeRefs, usePresence } from "./overlay-internals.js";
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
      role="list"
      className={classNames("combric-toast-viewport", className)}
    />,
    host,
  );
}

export type ToastPriority = "assertive" | "polite";

export interface ToastProps extends Omit<
  LiHTMLAttributes<HTMLLIElement>,
  "aria-atomic" | "aria-live" | "role"
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
  children,
  ...props
}: ToastProps): ReactElement | null {
  const [open, setOpen] = useControllableOpen({
    componentName: "Toast",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const presence = usePresence(open);

  useEffect(() => {
    if (!open || duration <= 0) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setOpen(false), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, open, setOpen]);

  if (!presence.present) {
    return null;
  }

  return (
    <ToastContext.Provider value={{ close: () => setOpen(false) }}>
      <li
        {...props}
        ref={mergeRefs(ref, presence.motionRef)}
        role={undefined}
        aria-live={undefined}
        aria-atomic={undefined}
        className={classNames("combric-toast", className)}
        data-priority={priority}
        data-state={presence.state}
        data-presence={presence.phase}
      >
        <div
          className="combric-toast__announcer"
          role={priority === "assertive" ? "alert" : "status"}
          aria-atomic="true"
        >
          {children}
        </div>
      </li>
    </ToastContext.Provider>
  );
}

export interface ToastTitleProps extends HTMLAttributes<HTMLElement> {
  icon?: IconSlot;
  ref?: Ref<HTMLElement>;
}

export function ToastTitle({
  className,
  icon,
  ref,
  children,
  ...props
}: ToastTitleProps): ReactElement {
  return (
    <strong
      {...props}
      ref={ref}
      className={classNames("combric-toast__title", className)}
    >
      {renderIconSlot(icon, "icon")}
      {children}
    </strong>
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
  leadingIcon?: IconSlot;
  ref?: Ref<HTMLButtonElement>;
  trailingIcon?: IconSlot;
}

export function ToastClose({
  className,
  leadingIcon,
  onClick,
  ref,
  trailingIcon,
  type = "button",
  children,
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
    >
      {renderIconSlot(leadingIcon, "leading")}
      {children}
      {renderIconSlot(trailingIcon, "trailing")}
    </button>
  );
}

"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";
import {
  mergeRefs,
  renderPortal,
  useAnchoredPosition,
  useControllableOpen,
  useDismissableLayer,
  useLayer,
  usePortalHost,
  type OverlayAlign,
  type OverlaySide,
} from "./overlay-internals.js";

interface TooltipContextValue {
  contentId: string;
  focusedRef: React.MutableRefObject<boolean>;
  hoveredRef: React.MutableRefObject<boolean>;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (context === null) {
    throw new Error("Tooltip components must be nested inside Tooltip.");
  }
  return context;
}

export interface TooltipProps extends PropsWithChildren {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function Tooltip({
  children,
  defaultOpen,
  onOpenChange,
  open: openProp,
}: TooltipProps): ReactElement {
  const [open, setOpen] = useControllableOpen({
    componentName: "Tooltip",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const contentId = `combric-tooltip-${useId().replaceAll(":", "")}`;
  const focusedRef = useRef(false);
  const hoveredRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <TooltipContext.Provider
      value={{
        contentId,
        focusedRef,
        hoveredRef,
        open,
        setOpen,
        triggerRef,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

export function TooltipTrigger({
  "aria-describedby": ariaDescribedBy,
  className,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  type = "button",
  ...props
}: TooltipTriggerProps): ReactElement {
  const context = useTooltipContext();

  function updateOpen(): void {
    context.setOpen(context.focusedRef.current || context.hoveredRef.current);
  }

  const descriptions = [
    ariaDescribedBy,
    context.open ? context.contentId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      type={type}
      aria-describedby={descriptions || undefined}
      className={classNames("combric-tooltip__trigger", className)}
      data-state={context.open ? "open" : "closed"}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) {
          context.focusedRef.current = true;
          updateOpen();
        }
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented) {
          context.focusedRef.current = false;
          updateOpen();
        }
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) {
          context.hoveredRef.current = true;
          updateOpen();
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) {
          context.hoveredRef.current = false;
          updateOpen();
        }
      }}
    />
  );
}

export type TooltipSide = OverlaySide;
export type TooltipAlign = OverlayAlign;

export interface TooltipContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  align?: TooltipAlign;
  container?: HTMLElement | null;
  ref?: Ref<HTMLDivElement>;
  side?: TooltipSide;
}

export function TooltipContent({
  align = "center",
  className,
  container,
  ref,
  side = "top",
  style,
  ...props
}: TooltipContentProps): ReactElement | null {
  const context = useTooltipContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const host = usePortalHost(container);
  const layerId = useLayer(context.open);
  const position = useAnchoredPosition({
    active: context.open && host !== null,
    align,
    contentRef,
    side,
    triggerRef: context.triggerRef,
  });

  useDismissableLayer({
    active: context.open,
    contentRef,
    layerId,
    onEscape: () => {
      context.focusedRef.current = false;
      context.hoveredRef.current = false;
      context.setOpen(false);
    },
    onOutside: () => undefined,
    triggerRef: context.triggerRef,
  });

  if (!context.open) {
    return null;
  }

  return renderPortal(
    <div
      {...props}
      ref={mergeRefs(contentRef, ref)}
      id={context.contentId}
      role="tooltip"
      className={classNames("combric-tooltip__content", className)}
      data-side={position.resolvedSide}
      data-state="open"
      style={{ ...position.style, ...style }}
    />,
    host,
  );
}

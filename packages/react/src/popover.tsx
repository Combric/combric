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
  useFocusRestoration,
  useLayer,
  usePortalHost,
  type OverlayAlign,
  type OverlaySide,
} from "./overlay-internals.js";

interface PopoverContextValue {
  close: (restoreFocus: boolean) => void;
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (context === null) {
    throw new Error("Popover components must be nested inside Popover.");
  }
  return context;
}

export interface PopoverProps extends PropsWithChildren {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function Popover({
  children,
  defaultOpen,
  onOpenChange,
  open: openProp,
}: PopoverProps): ReactElement {
  const [open, setOpen] = useControllableOpen({
    componentName: "Popover",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const contentId = `combric-popover-${useId().replaceAll(":", "")}`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef(true);

  useFocusRestoration(open, triggerRef, restoreFocusRef);

  function close(restoreFocus: boolean): void {
    restoreFocusRef.current = restoreFocus;
    setOpen(false);
  }

  return (
    <PopoverContext.Provider
      value={{ close, contentId, open, setOpen, triggerRef }}
    >
      {children}
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

export function PopoverTrigger({
  className,
  disabled,
  onClick,
  ref,
  type = "button",
  ...props
}: PopoverTriggerProps): ReactElement {
  const context = usePopoverContext();
  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      className={classNames("combric-popover__trigger", className)}
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

export type PopoverSide = OverlaySide;
export type PopoverAlign = OverlayAlign;

export interface PopoverContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id"
> {
  align?: PopoverAlign;
  container?: HTMLElement | null;
  ref?: Ref<HTMLDivElement>;
  side?: PopoverSide;
}

export function PopoverContent({
  align = "start",
  className,
  container,
  ref,
  side = "bottom",
  style,
  ...props
}: PopoverContentProps): ReactElement | null {
  const context = usePopoverContext();
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
    onEscape: () => context.close(true),
    onOutside: () => context.close(false),
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
      className={classNames("combric-popover__content", className)}
      data-side={position.resolvedSide}
      data-state="open"
      style={{ ...position.style, ...style }}
    />,
    host,
  );
}

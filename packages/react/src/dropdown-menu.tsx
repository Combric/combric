"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
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

type MenuFocusIntent = "first" | "last";

interface DropdownMenuContextValue {
  close: (restoreFocus: boolean) => void;
  contentId: string;
  focusIntentRef: React.MutableRefObject<MenuFocusIntent>;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null,
);

function useDropdownMenuContext(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (context === null) {
    throw new Error(
      "DropdownMenu components must be nested inside DropdownMenu.",
    );
  }
  return context;
}

export interface DropdownMenuProps extends PropsWithChildren {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function DropdownMenu({
  children,
  defaultOpen,
  onOpenChange,
  open: openProp,
}: DropdownMenuProps): ReactElement {
  const [open, setOpen] = useControllableOpen({
    componentName: "DropdownMenu",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const baseId = `combric-menu-${useId().replaceAll(":", "")}`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const focusIntentRef = useRef<MenuFocusIntent>("first");
  const restoreFocusRef = useRef(true);

  useFocusRestoration(open, triggerRef, restoreFocusRef);

  function close(restoreFocus: boolean): void {
    restoreFocusRef.current = restoreFocus;
    setOpen(false);
  }

  return (
    <DropdownMenuContext.Provider
      value={{
        close,
        contentId: `${baseId}-content`,
        focusIntentRef,
        open,
        setOpen,
        triggerId: `${baseId}-trigger`,
        triggerRef,
      }}
    >
      {children}
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

export function DropdownMenuTrigger({
  className,
  disabled,
  onClick,
  onKeyDown,
  ref,
  type = "button",
  ...props
}: DropdownMenuTriggerProps): ReactElement {
  const context = useDropdownMenuContext();

  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      id={context.triggerId}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      aria-haspopup="menu"
      className={classNames("combric-dropdown-menu__trigger", className)}
      data-state={context.open ? "open" : "closed"}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.focusIntentRef.current = "first";
          context.setOpen(!context.open);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          context.focusIntentRef.current =
            event.key === "ArrowDown" ? "first" : "last";
          context.setOpen(true);
        }
      }}
    />
  );
}

export type DropdownMenuSide = OverlaySide;
export type DropdownMenuAlign = OverlayAlign;

export interface DropdownMenuContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  align?: DropdownMenuAlign;
  container?: HTMLElement | null;
  ref?: Ref<HTMLDivElement>;
  side?: DropdownMenuSide;
}

export function DropdownMenuContent({
  align = "start",
  className,
  container,
  onKeyDown,
  ref,
  side = "bottom",
  style,
  ...props
}: DropdownMenuContentProps): ReactElement | null {
  const context = useDropdownMenuContext();
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

  useEffect(() => {
    if (!context.open || host === null) {
      return;
    }
    const items = Array.from(
      contentRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    const target =
      context.focusIntentRef.current === "last" ? items.at(-1) : items[0];
    target?.focus();
  }, [context.focusIntentRef, context.open, host]);

  function moveFocus(event: KeyboardEvent<HTMLDivElement>): void {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ),
    );
    if (items.length === 0) {
      return;
    }
    const currentIndex = items.indexOf(
      event.currentTarget.ownerDocument.activeElement as HTMLButtonElement,
    );
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }
    if (nextIndex !== undefined) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  }

  if (!context.open) {
    return null;
  }

  return renderPortal(
    <div
      {...props}
      ref={mergeRefs(contentRef, ref)}
      id={context.contentId}
      role="menu"
      aria-labelledby={context.triggerId}
      className={classNames("combric-dropdown-menu__content", className)}
      data-side={position.resolvedSide}
      data-state="open"
      style={{ ...position.style, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (event.key === "Tab") {
          context.close(true);
          context.triggerRef.current?.focus();
          return;
        }
        moveFocus(event);
      }}
    />,
    host,
  );
}

export interface DropdownMenuItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "role"
> {
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
}

export function DropdownMenuItem({
  className,
  disabled,
  onClick,
  onKeyDown,
  onSelect,
  ref,
  type = "button",
  ...props
}: DropdownMenuItemProps): ReactElement {
  const context = useDropdownMenuContext();
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      role="menuitem"
      className={classNames("combric-dropdown-menu__item", className)}
      disabled={disabled}
      tabIndex={-1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onSelect?.(event);
        }
        if (!event.defaultPrevented) {
          context.close(true);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    />
  );
}

export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function DropdownMenuSeparator({
  className,
  ref,
  ...props
}: DropdownMenuSeparatorProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      className={classNames("combric-dropdown-menu__separator", className)}
    />
  );
}

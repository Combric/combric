"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import {
  mergeRefs,
  renderOverlayPortal,
  useControllableOpen,
  useOverlayDismiss,
  useOverlayFocusReturn,
  useOverlayLayer,
  useOverlayPortalHost,
  useOverlayPositioning,
  type OverlayAlign,
  type OverlaySide,
  type OverlayStrategy,
  type OverlayVirtualAnchor,
} from "@combric/react/overlay";

type MenuFocusIntent = "first" | "last";

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

function createPointAnchor(
  contextElement: Element,
  clientX: number,
  clientY: number,
): OverlayVirtualAnchor {
  return {
    contextElement,
    getBoundingClientRect: () =>
      ({
        bottom: clientY,
        height: 0,
        left: clientX,
        right: clientX,
        toJSON: () => ({}),
        top: clientY,
        width: 0,
        x: clientX,
        y: clientY,
      }) as DOMRect,
  };
}

function contextMenuItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-combric-context-menu-item]"),
  ).filter(
    (item) =>
      item.getAttribute("aria-hidden") !== "true" &&
      item.getAttribute("aria-disabled") !== "true",
  );
}

function contextMenuItemLabel(item: HTMLElement): string {
  const explicitLabel = item.getAttribute("data-context-menu-text");
  const label = item.querySelector<HTMLElement>(
    "[data-combric-context-menu-label]",
  );
  return (explicitLabel ?? label?.textContent ?? item.textContent ?? "")
    .trim()
    .toLocaleLowerCase();
}

interface ContextMenuContextValue {
  anchor: OverlayVirtualAnchor | null;
  close: (restoreFocus?: boolean) => void;
  contentId: string;
  focusIntentRef: MutableRefObject<MenuFocusIntent>;
  layerId: string;
  open: boolean;
  openAt: (anchor: OverlayVirtualAnchor) => void;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLDivElement | null>;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(): ContextMenuContextValue {
  const context = useContext(ContextMenuContext);
  if (context === null) {
    throw new Error(
      "ContextMenu components must be nested inside ContextMenu.",
    );
  }
  return context;
}

export interface ContextMenuProps extends PropsWithChildren {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

/** A pointer-anchored action menu for contextual operations. */
export function ContextMenu({
  children,
  defaultOpen,
  onOpenChange,
  open: openProp,
}: ContextMenuProps): ReactElement {
  const controlled = openProp !== undefined;
  const [open, setOpen] = useControllableOpen({
    componentName: "ContextMenu",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const [anchor, setAnchor] = useState<OverlayVirtualAnchor | null>(null);
  const baseId = `combric-context-menu-${useId().replaceAll(":", "")}`;
  const focusIntentRef = useRef<MenuFocusIntent>("first");
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const layerId = useOverlayLayer(open);

  useOverlayFocusReturn(open, triggerRef, restoreFocusRef);

  const close = useCallback(
    (restoreFocus = true) => {
      restoreFocusRef.current = restoreFocus;
      setOpen(false);
      if (!controlled) {
        setAnchor(null);
      }
    },
    [controlled, setOpen],
  );
  const openAt = useCallback(
    (nextAnchor: OverlayVirtualAnchor) => {
      restoreFocusRef.current = true;
      focusIntentRef.current = "first";
      setAnchor(nextAnchor);
      setOpen(true);
    },
    [setOpen],
  );
  const context = useMemo<ContextMenuContextValue>(
    () => ({
      anchor,
      close,
      contentId: `${baseId}-content`,
      focusIntentRef,
      layerId,
      open,
      openAt,
      triggerId: `${baseId}-trigger`,
      triggerRef,
    }),
    [anchor, baseId, close, layerId, open, openAt],
  );

  return (
    <ContextMenuContext.Provider value={context}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export interface ContextMenuTriggerRenderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className: string;
  "data-state": "open" | "closed";
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  /** Renders a custom context region without relying on asChild cloning. */
  render?: (props: ContextMenuTriggerRenderProps) => ReactElement;
  ref?: Ref<HTMLDivElement>;
}

export function ContextMenuTrigger({
  children,
  className,
  onContextMenu,
  onKeyDown,
  ref,
  render,
  ...props
}: ContextMenuTriggerProps): ReactElement {
  const context = useContextMenuContext();
  const triggerProps: ContextMenuTriggerRenderProps = {
    ...props,
    ref: mergeRefs(context.triggerRef, ref),
    "aria-controls": context.contentId,
    "aria-haspopup": "menu",
    children,
    className: classNames("combric-context-menu__trigger", className),
    "data-state": context.open ? "open" : "closed",
    id: context.triggerId,
    onContextMenu: (event) => {
      onContextMenu?.(event);
      if (event.defaultPrevented) {
        return;
      }
      event.preventDefault();
      context.openAt(
        createPointAnchor(event.currentTarget, event.clientX, event.clientY),
      );
    },
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        (event.key !== "ContextMenu" &&
          !(event.key === "F10" && event.shiftKey))
      ) {
        return;
      }
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      context.openAt(
        createPointAnchor(
          event.currentTarget,
          bounds.left + bounds.width / 2,
          bounds.top + bounds.height / 2,
        ),
      );
    },
  };

  return render === undefined ? (
    <div {...triggerProps} />
  ) : (
    render(triggerProps)
  );
}

export type ContextMenuSide = OverlaySide;
export type ContextMenuAlign = OverlayAlign;

export interface ContextMenuContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  align?: ContextMenuAlign;
  boundary?: Element;
  collisionPadding?: number;
  container?: HTMLElement | null;
  offset?: number;
  ref?: Ref<HTMLDivElement>;
  side?: ContextMenuSide;
  strategy?: OverlayStrategy;
}

interface ContextMenuPanelProps extends ContextMenuContentProps {
  context: ContextMenuContextValue;
}

function ContextMenuPanel({
  align = "start",
  boundary,
  children,
  className,
  collisionPadding = 8,
  container,
  offset = 2,
  onKeyDown,
  ref,
  side = "bottom",
  strategy = "fixed",
  style,
  context,
  ...props
}: ContextMenuPanelProps): ReactElement | null {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const host = useOverlayPortalHost(container);
  const positioning = useOverlayPositioning({
    align,
    collisionPadding,
    offset,
    open: true,
    side,
    strategy,
    ...(boundary === undefined ? {} : { boundary }),
  });
  const typeaheadRef = useRef({ buffer: "", timestamp: 0 });

  useEffect(() => {
    positioning.refs.setPositionReference(context.anchor);
  }, [context.anchor, positioning.refs.setPositionReference]);

  useOverlayDismiss({
    active: true,
    contentRef,
    layerId: context.layerId,
    onEscape: () => context.close(true),
    onOutside: () => context.close(false),
    triggerRef: context.triggerRef,
  });

  useEffect(() => {
    if (host === null) {
      return;
    }
    queueMicrotask(() => {
      const content = contentRef.current;
      if (content === null) {
        return;
      }
      const items = contextMenuItems(content);
      const target =
        context.focusIntentRef.current === "last" ? items.at(-1) : items[0];
      (target ?? content).focus();
    });
  }, [context.focusIntentRef, host]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Tab") {
      context.close(false);
      return;
    }

    const items = contextMenuItems(event.currentTarget);
    if (items.length === 0) {
      return;
    }
    const currentIndex = items.indexOf(
      event.currentTarget.ownerDocument.activeElement as HTMLElement,
    );
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1 + items.length) % items.length;
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
      return;
    }

    if (
      event.key.length !== 1 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const timestamp = Date.now();
    const nextBuffer =
      timestamp - typeaheadRef.current.timestamp > 500
        ? event.key
        : `${typeaheadRef.current.buffer}${event.key}`;
    typeaheadRef.current = { buffer: nextBuffer, timestamp };
    const query = nextBuffer.toLocaleLowerCase();
    const startIndex = currentIndex < 0 ? 0 : currentIndex + 1;
    const match = Array.from({ length: items.length }, (_, offsetIndex) => {
      return items[(startIndex + offsetIndex) % items.length]!;
    }).find((item) => contextMenuItemLabel(item).startsWith(query));

    if (match !== undefined) {
      event.preventDefault();
      match.focus();
    }
  }

  if (host === null) {
    return null;
  }

  return renderOverlayPortal(
    <div
      {...props}
      ref={mergeRefs(contentRef, ref, positioning.refs.setFloating)}
      id={context.contentId}
      role="menu"
      tabIndex={-1}
      aria-labelledby={context.triggerId}
      aria-orientation="vertical"
      className={classNames("combric-context-menu__content", className)}
      data-align={positioning.align}
      data-positioned={positioning.isPositioned ? "true" : "false"}
      data-side={positioning.side}
      data-state="open"
      style={{ ...positioning.floatingStyles, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) {
          handleKeyDown(event);
        }
      }}
    >
      {children}
    </div>,
    host,
  );
}

export function ContextMenuContent(
  props: ContextMenuContentProps,
): ReactElement | null {
  const context = useContextMenuContext();

  return context.open && context.anchor !== null ? (
    <ContextMenuPanel {...props} context={context} />
  ) : null;
}

export interface ContextMenuItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect" | "role" | "tabIndex"
> {
  leading?: ReactNode;
  onSelect?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  textValue?: string;
  trailing?: ReactNode;
}

export function ContextMenuItem({
  children,
  className,
  disabled,
  leading,
  onClick,
  onKeyDown,
  onSelect,
  ref,
  textValue,
  trailing,
  type = "button",
  ...props
}: ContextMenuItemProps): ReactElement {
  const context = useContextMenuContext();

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={classNames("combric-context-menu__item", className)}
      data-combric-context-menu-item=""
      data-context-menu-text={textValue}
      disabled={disabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        onSelect?.(event);
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
    >
      {leading === undefined ? null : (
        <span className="combric-context-menu__item-leading">{leading}</span>
      )}
      <span data-combric-context-menu-label>{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-context-menu__item-trailing">{trailing}</span>
      )}
    </button>
  );
}

export interface ContextMenuSeparatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  ref?: Ref<HTMLDivElement>;
}

export function ContextMenuSeparator({
  className,
  ref,
  ...props
}: ContextMenuSeparatorProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={classNames("combric-context-menu__separator", className)}
    />
  );
}

export interface ContextMenuLabelProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  ref?: Ref<HTMLDivElement>;
}

export function ContextMenuLabel({
  className,
  ref,
  ...props
}: ContextMenuLabelProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="presentation"
      className={classNames("combric-context-menu__label", className)}
    />
  );
}

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
  useOverlayDismiss,
  useOverlayLayer,
} from "@combric/react/overlay";

type MenuFocusIntent = "first" | "last";
type MenubarFocusDirection = "first" | "last" | "next" | "previous";

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

function menubarItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-combric-menubar-item]"),
  ).filter(
    (item) =>
      item.getAttribute("aria-hidden") !== "true" &&
      item.getAttribute("aria-disabled") !== "true",
  );
}

function menubarItemLabel(item: HTMLElement): string {
  const explicitLabel = item.getAttribute("data-menubar-text");
  const label = item.querySelector<HTMLElement>("[data-combric-menubar-label]");
  return (explicitLabel ?? label?.textContent ?? item.textContent ?? "")
    .trim()
    .toLocaleLowerCase();
}

interface MenubarContextValue {
  moveFocus: (
    current: HTMLButtonElement | null,
    direction: MenubarFocusDirection,
  ) => void;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  setValue: (value: string | null) => void;
  value: string | null;
}

interface MenubarMenuContextValue {
  close: (restoreFocus?: boolean) => void;
  contentId: string;
  focusIntentRef: MutableRefObject<MenuFocusIntent>;
  layerId: string;
  moveFocus: MenubarContextValue["moveFocus"];
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);
const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);

function useMenubarContext(): MenubarContextValue {
  const context = useContext(MenubarContext);
  if (context === null) {
    throw new Error("Menubar components must be nested inside Menubar.");
  }
  return context;
}

function useMenubarMenuContext(): MenubarMenuContextValue {
  const context = useContext(MenubarMenuContext);
  if (context === null) {
    throw new Error(
      "MenubarTrigger and MenubarContent must be nested inside MenubarMenu.",
    );
  }
  return context;
}

function useControllableMenubarValue({
  defaultValue,
  onValueChange,
  value,
}: {
  defaultValue?: string | undefined;
  onValueChange?: ((value: string | null) => void) | undefined;
  value?: string | null | undefined;
}): readonly [string | null, (value: string | null) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    defaultValue ?? null,
  );
  const controlled = value !== undefined;
  const initialControlled = useRef(controlled);
  const currentValue = controlled ? value : uncontrolledValue;
  const currentValueRef = useRef(currentValue);
  const onValueChangeRef = useRef(onValueChange);
  currentValueRef.current = currentValue;
  onValueChangeRef.current = onValueChange;

  if (initialControlled.current !== controlled) {
    throw new Error(
      "Menubar cannot switch between controlled and uncontrolled modes.",
    );
  }

  const setValue = useCallback((nextValue: string | null) => {
    if (!initialControlled.current) {
      setUncontrolledValue(nextValue);
    }
    if (nextValue !== currentValueRef.current) {
      onValueChangeRef.current?.(nextValue);
    }
  }, []);

  return [currentValue, setValue] as const;
}

export interface MenubarProps
  extends PropsWithChildren, Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  ref?: Ref<HTMLDivElement>;
  /** Use null to control a closed menubar. */
  value?: string | null;
}

/** An application menubar with roving trigger focus and one open menu. */
export function Menubar({
  children,
  className,
  defaultValue,
  onValueChange,
  ref,
  value: valueProp,
  ...props
}: MenubarProps): ReactElement {
  const [value, setValue] = useControllableMenubarValue({
    defaultValue,
    onValueChange,
    value: valueProp,
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const moveFocus = useCallback<MenubarContextValue["moveFocus"]>(
    (current, direction) => {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      const triggers = Array.from(
        root.querySelectorAll<HTMLButtonElement>(
          "[data-combric-menubar-trigger]",
        ),
      ).filter((trigger) => !trigger.disabled);
      if (triggers.length === 0) {
        return;
      }
      const currentIndex = current === null ? -1 : triggers.indexOf(current);
      let nextIndex: number;
      if (direction === "first") {
        nextIndex = 0;
      } else if (direction === "last") {
        nextIndex = triggers.length - 1;
      } else if (direction === "next") {
        nextIndex = (currentIndex + 1 + triggers.length) % triggers.length;
      } else {
        nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
      }

      setValue(null);
      triggers[nextIndex]?.focus();
    },
    [setValue],
  );
  const context = useMemo<MenubarContextValue>(
    () => ({ moveFocus, rootRef, setValue, value }),
    [moveFocus, setValue, value],
  );

  return (
    <MenubarContext.Provider value={context}>
      <div
        {...props}
        ref={mergeRefs(rootRef, ref)}
        role="menubar"
        className={classNames("combric-menubar", className)}
      >
        {children}
      </div>
    </MenubarContext.Provider>
  );
}

export interface MenubarMenuProps
  extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  value: string;
}

export function MenubarMenu({
  children,
  className,
  ref,
  value,
  ...props
}: MenubarMenuProps): ReactElement {
  const menubar = useMenubarContext();
  const open = menubar.value === value;
  const baseId = `combric-menubar-menu-${useId().replaceAll(":", "")}`;
  const focusIntentRef = useRef<MenuFocusIntent>("first");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const layerId = useOverlayLayer(open);
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        menubar.setValue(value);
      } else if (open) {
        menubar.setValue(null);
      }
    },
    [menubar, open, value],
  );
  const close = useCallback(
    (restoreFocus = true) => {
      setOpen(false);
      if (restoreFocus) {
        queueMicrotask(() => triggerRef.current?.focus());
      }
    },
    [setOpen],
  );
  const context = useMemo<MenubarMenuContextValue>(
    () => ({
      close,
      contentId: `${baseId}-content`,
      focusIntentRef,
      layerId,
      moveFocus: menubar.moveFocus,
      open,
      setOpen,
      triggerId: `${baseId}-trigger`,
      triggerRef,
    }),
    [baseId, close, layerId, menubar.moveFocus, open, setOpen],
  );

  return (
    <MenubarMenuContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        className={classNames("combric-menubar__menu", className)}
        data-state={open ? "open" : "closed"}
      >
        {children}
      </div>
    </MenubarMenuContext.Provider>
  );
}

export interface MenubarTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  trailing?: ReactNode;
}

export function MenubarTrigger({
  children,
  className,
  disabled,
  leading,
  onClick,
  onKeyDown,
  ref,
  trailing,
  type = "button",
  ...props
}: MenubarTriggerProps): ReactElement {
  const context = useMenubarMenuContext();

  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      id={context.triggerId}
      type={type}
      role="menuitem"
      aria-controls={context.contentId}
      aria-expanded={context.open}
      aria-haspopup="menu"
      className={classNames("combric-menubar__trigger", className)}
      data-combric-menubar-trigger=""
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
        if (event.key === "ArrowRight") {
          event.preventDefault();
          context.moveFocus(event.currentTarget, "next");
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          context.moveFocus(event.currentTarget, "previous");
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          context.moveFocus(event.currentTarget, "first");
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          context.moveFocus(event.currentTarget, "last");
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          context.focusIntentRef.current =
            event.key === "ArrowDown" ? "first" : "last";
          context.setOpen(true);
        }
      }}
    >
      {leading === undefined ? null : (
        <span className="combric-menubar__trigger-leading">{leading}</span>
      )}
      <span className="combric-menubar__trigger-label">{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-menubar__trigger-trailing">{trailing}</span>
      )}
    </button>
  );
}

export interface MenubarContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  ref?: Ref<HTMLDivElement>;
}

interface MenubarPanelProps extends MenubarContentProps {
  context: MenubarMenuContextValue;
}

function MenubarPanel({
  children,
  className,
  onKeyDown,
  ref,
  context,
  ...props
}: MenubarPanelProps): ReactElement {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef({ buffer: "", timestamp: 0 });

  useOverlayDismiss({
    active: true,
    contentRef,
    layerId: context.layerId,
    onEscape: () => context.close(true),
    onOutside: () => context.close(false),
    triggerRef: context.triggerRef,
  });

  useEffect(() => {
    queueMicrotask(() => {
      const content = contentRef.current;
      if (content === null) {
        return;
      }
      const items = menubarItems(content);
      const target =
        context.focusIntentRef.current === "last" ? items.at(-1) : items[0];
      (target ?? content).focus();
    });
  }, [context.focusIntentRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Tab") {
      context.close(false);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      context.moveFocus(
        context.triggerRef.current,
        event.key === "ArrowRight" ? "next" : "previous",
      );
      return;
    }

    const items = menubarItems(event.currentTarget);
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
    const match = Array.from({ length: items.length }, (_, offset) => {
      return items[(startIndex + offset) % items.length]!;
    }).find((item) => menubarItemLabel(item).startsWith(query));

    if (match !== undefined) {
      event.preventDefault();
      match.focus();
    }
  }

  return (
    <div
      {...props}
      ref={mergeRefs(contentRef, ref)}
      id={context.contentId}
      role="menu"
      tabIndex={-1}
      aria-labelledby={context.triggerId}
      aria-orientation="vertical"
      className={classNames("combric-menubar__content", className)}
      data-state="open"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) {
          handleKeyDown(event);
        }
      }}
    >
      {children}
    </div>
  );
}

export function MenubarContent(
  props: MenubarContentProps,
): ReactElement | null {
  const context = useMenubarMenuContext();

  return context.open ? <MenubarPanel {...props} context={context} /> : null;
}

export interface MenubarItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect" | "role" | "tabIndex"
> {
  leading?: ReactNode;
  onSelect?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  textValue?: string;
  trailing?: ReactNode;
}

export function MenubarItem({
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
}: MenubarItemProps): ReactElement {
  const context = useMenubarMenuContext();

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={classNames("combric-menubar__item", className)}
      data-combric-menubar-item=""
      data-menubar-text={textValue}
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
        <span className="combric-menubar__item-leading">{leading}</span>
      )}
      <span data-combric-menubar-label>{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-menubar__item-trailing">{trailing}</span>
      )}
    </button>
  );
}

export interface MenubarSeparatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  ref?: Ref<HTMLDivElement>;
}

export function MenubarSeparator({
  className,
  ref,
  ...props
}: MenubarSeparatorProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={classNames("combric-menubar__separator", className)}
    />
  );
}

export interface MenubarLabelProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  ref?: Ref<HTMLDivElement>;
}

export function MenubarLabel({
  className,
  ref,
  ...props
}: MenubarLabelProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="presentation"
      className={classNames("combric-menubar__label", className)}
    />
  );
}

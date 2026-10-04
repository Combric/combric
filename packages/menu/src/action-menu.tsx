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
  type MouseEvent,
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
  useOverlayPresence,
  type OverlayAlign,
  type OverlaySide,
  type OverlayStrategy,
} from "@combric/react/overlay";

type MenuFocusIntent = "first" | "last";
type ActionMenuItemRole = "menuitem" | "menuitemcheckbox" | "menuitemradio";

interface ActionMenuContextValue {
  close: (restoreFocus?: boolean) => void;
  contentId: string;
  focusIntentRef: MutableRefObject<MenuFocusIntent>;
  layerId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

interface ActionMenuRadioGroupContextValue {
  setValue: (value: string) => void;
  value: string | undefined;
}

const ActionMenuRadioGroupContext =
  createContext<ActionMenuRadioGroupContextValue | null>(null);

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

function useActionMenuContext(): ActionMenuContextValue {
  const context = useContext(ActionMenuContext);
  if (context === null) {
    throw new Error("ActionMenu components must be nested inside ActionMenu.");
  }
  return context;
}

function useActionMenuRadioGroupContext(): ActionMenuRadioGroupContextValue {
  const context = useContext(ActionMenuRadioGroupContext);
  if (context === null) {
    throw new Error(
      "ActionMenuRadioItem must be nested inside ActionMenuRadioGroup.",
    );
  }
  return context;
}

function actionMenuItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-combric-action-menu-item]"),
  ).filter((item) => item.getAttribute("aria-hidden") !== "true");
}

function actionMenuItemLabel(item: HTMLElement): string {
  const explicitLabel = item.getAttribute("data-action-menu-text");
  const label = item.querySelector<HTMLElement>(
    "[data-combric-action-menu-label]",
  );
  return (explicitLabel ?? label?.textContent ?? item.textContent ?? "")
    .trim()
    .toLocaleLowerCase();
}

function useControllableValue({
  defaultValue,
  onValueChange,
  value,
}: {
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  value?: string | undefined;
}): readonly [string | undefined, (value: string) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const setValue = useCallback(
    (nextValue: string) => {
      onValueChange?.(nextValue);
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
    },
    [isControlled, onValueChange],
  );

  return [currentValue, setValue];
}

export interface ActionMenuProps extends PropsWithChildren {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

/**
 * A menu button for application actions. It is intentionally distinct from
 * website navigation, which is delivered by the Navigation Menu family.
 */
export function ActionMenu({
  children,
  defaultOpen,
  onOpenChange,
  open: openProp,
}: ActionMenuProps): ReactElement {
  const [open, setOpen] = useControllableOpen({
    componentName: "ActionMenu",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const baseId = `combric-action-menu-${useId().replaceAll(":", "")}`;
  const focusIntentRef = useRef<MenuFocusIntent>("first");
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const layerId = useOverlayLayer(open);

  useOverlayFocusReturn(open, triggerRef, restoreFocusRef);

  const close = useCallback(
    (restoreFocus = true) => {
      restoreFocusRef.current = restoreFocus;
      setOpen(false);
    },
    [setOpen],
  );
  const context = useMemo<ActionMenuContextValue>(
    () => ({
      close,
      contentId: `${baseId}-content`,
      focusIntentRef,
      layerId,
      open,
      setOpen,
      triggerId: `${baseId}-trigger`,
      triggerRef,
    }),
    [baseId, close, layerId, open, setOpen],
  );

  return (
    <ActionMenuContext.Provider value={context}>
      {children}
    </ActionMenuContext.Provider>
  );
}

export interface ActionMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  trailing?: ReactNode;
}

export function ActionMenuTrigger({
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
}: ActionMenuTriggerProps): ReactElement {
  const context = useActionMenuContext();

  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      id={context.triggerId}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      aria-haspopup="menu"
      className={classNames("combric-action-menu__trigger", className)}
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
    >
      {leading === undefined ? null : (
        <span className="combric-action-menu__item-leading">{leading}</span>
      )}
      <span className="combric-action-menu__trigger-label">{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-action-menu__item-trailing">{trailing}</span>
      )}
    </button>
  );
}

export type ActionMenuSide = OverlaySide;
export type ActionMenuAlign = OverlayAlign;

export interface ActionMenuContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  align?: ActionMenuAlign;
  boundary?: Element;
  collisionPadding?: number;
  container?: HTMLElement | null;
  offset?: number;
  ref?: Ref<HTMLDivElement>;
  side?: ActionMenuSide;
  strategy?: OverlayStrategy;
}

export function ActionMenuContent({
  align = "start",
  boundary,
  children,
  className,
  collisionPadding = 8,
  container,
  offset = 8,
  onKeyDown,
  ref,
  side = "bottom",
  strategy = "fixed",
  style,
  ...props
}: ActionMenuContentProps): ReactElement | null {
  const context = useActionMenuContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const host = useOverlayPortalHost(container);
  const presence = useOverlayPresence(context.open);
  const positioning = useOverlayPositioning({
    align,
    collisionPadding,
    offset,
    open: context.open,
    side,
    strategy,
    ...(boundary === undefined ? {} : { boundary }),
  });
  const typeaheadRef = useRef({ buffer: "", timestamp: 0 });

  useEffect(() => {
    positioning.refs.setReference(context.triggerRef.current);
  }, [context.triggerRef, positioning.refs.setReference]);

  useOverlayDismiss({
    active: context.open,
    contentRef,
    layerId: context.layerId,
    onEscape: () => context.close(true),
    onOutside: () => context.close(false),
    triggerRef: context.triggerRef,
  });

  useEffect(() => {
    if (!context.open || !presence.present || host === null) {
      return;
    }
    queueMicrotask(() => {
      const content = contentRef.current;
      if (content === null) {
        return;
      }
      const items = actionMenuItems(content);
      const target =
        context.focusIntentRef.current === "last" ? items.at(-1) : items[0];
      (target ?? content).focus();
    });
  }, [context.focusIntentRef, context.open, host, presence.present]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Tab") {
      context.close(false);
      return;
    }

    const items = actionMenuItems(event.currentTarget);
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
    }).find((item) => actionMenuItemLabel(item).startsWith(query));

    if (match !== undefined) {
      event.preventDefault();
      match.focus();
    }
  }

  if (!presence.present) {
    return null;
  }

  return renderOverlayPortal(
    <div
      {...props}
      ref={mergeRefs(
        contentRef,
        ref,
        positioning.refs.setFloating,
        presence.motionRef,
      )}
      id={context.contentId}
      role="menu"
      tabIndex={-1}
      aria-hidden={!context.open}
      aria-labelledby={context.triggerId}
      aria-orientation="vertical"
      inert={!context.open}
      className={classNames("combric-action-menu__content", className)}
      data-align={positioning.align}
      data-positioned={positioning.isPositioned ? "true" : "false"}
      data-presence={presence.phase}
      data-side={positioning.side}
      data-state={presence.state}
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

interface ActionMenuItemButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect" | "role" | "tabIndex"
> {
  checked?: boolean;
  closeOnSelect: boolean;
  leading?: ReactNode;
  onActivate?: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  role: ActionMenuItemRole;
  textValue?: string;
  trailing?: ReactNode;
}

function ActionMenuItemButton({
  checked,
  children,
  className,
  closeOnSelect,
  disabled,
  leading,
  onActivate,
  onClick,
  onKeyDown,
  onSelect,
  ref,
  role,
  textValue,
  trailing,
  type = "button",
  ...props
}: ActionMenuItemButtonProps): ReactElement {
  const context = useActionMenuContext();
  const isCheckable = role !== "menuitem";

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      role={role}
      tabIndex={-1}
      aria-checked={isCheckable ? checked : undefined}
      aria-disabled={disabled || undefined}
      className={classNames(
        "combric-action-menu__item",
        isCheckable && "combric-action-menu__item--checkable",
        className,
      )}
      data-action-menu-text={textValue}
      data-combric-action-menu-item=""
      data-disabled={disabled ? "true" : undefined}
      data-state={isCheckable ? (checked ? "checked" : "unchecked") : "idle"}
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
        if (event.defaultPrevented) {
          return;
        }
        onActivate?.(event);
        if (!event.defaultPrevented && closeOnSelect) {
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
      {isCheckable ? (
        <span
          aria-hidden="true"
          className="combric-action-menu__item-indicator"
        >
          {checked ? (role === "menuitemradio" ? "•" : "✓") : ""}
        </span>
      ) : null}
      {leading === undefined ? null : (
        <span className="combric-action-menu__item-leading">{leading}</span>
      )}
      <span data-combric-action-menu-label>{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-action-menu__item-trailing">{trailing}</span>
      )}
    </button>
  );
}

export interface ActionMenuItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect" | "role" | "tabIndex"
> {
  closeOnSelect?: boolean;
  leading?: ReactNode;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  textValue?: string;
  trailing?: ReactNode;
}

export function ActionMenuItem({
  closeOnSelect = true,
  ...props
}: ActionMenuItemProps): ReactElement {
  return (
    <ActionMenuItemButton
      {...props}
      closeOnSelect={closeOnSelect}
      role="menuitem"
    />
  );
}

export interface ActionMenuCheckboxItemProps extends Omit<
  ActionMenuItemProps,
  "closeOnSelect"
> {
  checked?: boolean;
  closeOnSelect?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function ActionMenuCheckboxItem({
  checked: checkedProp,
  closeOnSelect = false,
  defaultChecked,
  onCheckedChange,
  ...props
}: ActionMenuCheckboxItemProps): ReactElement {
  const [checked, setChecked] = useControllableOpen({
    componentName: "ActionMenuCheckboxItem",
    defaultOpen: defaultChecked,
    onOpenChange: onCheckedChange,
    open: checkedProp,
  });

  return (
    <ActionMenuItemButton
      {...props}
      checked={checked}
      closeOnSelect={closeOnSelect}
      role="menuitemcheckbox"
      onActivate={() => setChecked(!checked)}
    />
  );
}

export interface ActionMenuRadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
}

export function ActionMenuRadioGroup({
  children,
  className,
  defaultValue,
  onValueChange,
  value: valueProp,
  ...props
}: ActionMenuRadioGroupProps): ReactElement {
  const [value, setValue] = useControllableValue({
    defaultValue,
    onValueChange,
    value: valueProp,
  });
  const context = useMemo<ActionMenuRadioGroupContextValue>(
    () => ({ setValue, value }),
    [setValue, value],
  );

  return (
    <ActionMenuRadioGroupContext.Provider value={context}>
      <div
        {...props}
        role="group"
        className={classNames("combric-action-menu__radio-group", className)}
      >
        {children}
      </div>
    </ActionMenuRadioGroupContext.Provider>
  );
}

export interface ActionMenuRadioItemProps extends Omit<
  ActionMenuItemProps,
  "closeOnSelect" | "value"
> {
  closeOnSelect?: boolean;
  value: string;
}

export function ActionMenuRadioItem({
  closeOnSelect = false,
  value,
  ...props
}: ActionMenuRadioItemProps): ReactElement {
  const group = useActionMenuRadioGroupContext();
  const checked = group.value === value;

  return (
    <ActionMenuItemButton
      {...props}
      checked={checked}
      closeOnSelect={closeOnSelect}
      role="menuitemradio"
      onActivate={() => {
        if (!checked) {
          group.setValue(value);
        }
      }}
    />
  );
}

export interface ActionMenuSeparatorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  ref?: Ref<HTMLDivElement>;
}

export function ActionMenuSeparator({
  className,
  ref,
  ...props
}: ActionMenuSeparatorProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={classNames("combric-action-menu__separator", className)}
    />
  );
}

export interface ActionMenuLabelProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> {
  ref?: Ref<HTMLDivElement>;
}

export function ActionMenuLabel({
  className,
  ref,
  ...props
}: ActionMenuLabelProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      role="presentation"
      className={classNames("combric-action-menu__label", className)}
    />
  );
}

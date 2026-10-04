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
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type MutableRefObject,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import {
  mergeRefs,
  useOverlayDismiss,
  useOverlayFocusReturn,
  useOverlayLayer,
} from "@combric/react/overlay";

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

interface NavigationMenuContextValue {
  activeItemRef: MutableRefObject<NavigationMenuActiveItem | null>;
  openOnHover: boolean;
  setValue: (value: string | null) => void;
  value: string | null;
}

interface NavigationMenuActiveItem {
  restoreFocusRef: MutableRefObject<boolean>;
  value: string;
}

interface NavigationMenuItemContextValue {
  close: (restoreFocus?: boolean) => void;
  contentId: string;
  focusPanelRef: MutableRefObject<boolean>;
  layerId: string;
  open: boolean;
  openFromPointer: () => void;
  setOpen: (open: boolean) => void;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(
  null,
);
const NavigationMenuItemContext =
  createContext<NavigationMenuItemContextValue | null>(null);

function useNavigationMenuContext(): NavigationMenuContextValue {
  const context = useContext(NavigationMenuContext);
  if (context === null) {
    throw new Error(
      "NavigationMenuList and NavigationMenuItem must be nested inside NavigationMenu.",
    );
  }
  return context;
}

function useNavigationMenuItemContext(): NavigationMenuItemContextValue {
  const context = useContext(NavigationMenuItemContext);
  if (context === null) {
    throw new Error(
      "NavigationMenuTrigger and NavigationMenuContent must be nested inside NavigationMenuItem.",
    );
  }
  return context;
}

function useControllableNavigationValue({
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
      "NavigationMenu cannot switch between controlled and uncontrolled modes.",
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

export interface NavigationMenuProps
  extends PropsWithChildren, Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  defaultValue?: string;
  /** Enables a pointer convenience; keyboard and click activation always remain available. */
  openOnHover?: boolean;
  onValueChange?: (value: string | null) => void;
  ref?: Ref<HTMLElement>;
  /** Use null to control a closed menu. */
  value?: string | null;
}

/**
 * Semantic website navigation with a single expanded disclosure panel. Rich
 * panel contents are supplied by consumers, including cards, images, and CTAs.
 */
export function NavigationMenu({
  children,
  className,
  defaultValue,
  onValueChange,
  openOnHover = false,
  ref,
  value: valueProp,
  ...props
}: NavigationMenuProps): ReactElement {
  const [value, setValue] = useControllableNavigationValue({
    defaultValue,
    onValueChange,
    value: valueProp,
  });
  const activeItemRef = useRef<NavigationMenuActiveItem | null>(null);
  const context = useMemo<NavigationMenuContextValue>(
    () => ({ activeItemRef, openOnHover, setValue, value }),
    [openOnHover, setValue, value],
  );

  return (
    <NavigationMenuContext.Provider value={context}>
      <nav
        {...props}
        ref={ref}
        className={classNames("combric-navigation-menu", className)}
      >
        {children}
      </nav>
    </NavigationMenuContext.Provider>
  );
}

export interface NavigationMenuListProps extends HTMLAttributes<HTMLUListElement> {
  ref?: Ref<HTMLUListElement>;
}

export function NavigationMenuList({
  className,
  ref,
  ...props
}: NavigationMenuListProps): ReactElement {
  useNavigationMenuContext();

  return (
    <ul
      {...props}
      ref={ref}
      className={classNames("combric-navigation-menu__list", className)}
    />
  );
}

export interface NavigationMenuItemProps
  extends PropsWithChildren, LiHTMLAttributes<HTMLLIElement> {
  ref?: Ref<HTMLLIElement>;
  value: string;
}

export function NavigationMenuItem({
  children,
  className,
  onPointerEnter,
  onPointerLeave,
  ref,
  value,
  ...props
}: NavigationMenuItemProps): ReactElement {
  const menu = useNavigationMenuContext();
  const open = menu.value === value;
  const baseId = `combric-navigation-menu-${useId().replaceAll(":", "")}`;
  const focusPanelRef = useRef(false);
  const restoreFocusRef = useRef(true);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const layerId = useOverlayLayer(open);

  useOverlayFocusReturn(open, triggerRef, restoreFocusRef);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const activeItem: NavigationMenuActiveItem = { restoreFocusRef, value };
    menu.activeItemRef.current = activeItem;
    return () => {
      if (menu.activeItemRef.current === activeItem) {
        menu.activeItemRef.current = null;
      }
    };
  }, [menu.activeItemRef, open, value]);

  const suppressPreviousFocusReturn = useCallback(() => {
    const activeItem = menu.activeItemRef.current;
    if (activeItem !== null && activeItem.value !== value) {
      activeItem.restoreFocusRef.current = false;
    }
  }, [menu.activeItemRef, value]);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        suppressPreviousFocusReturn();
        menu.setValue(value);
      } else if (open) {
        menu.setValue(null);
      }
    },
    [menu, open, suppressPreviousFocusReturn, value],
  );
  const close = useCallback(
    (restoreFocus = true) => {
      restoreFocusRef.current = restoreFocus;
      setOpen(false);
    },
    [setOpen],
  );
  const openFromPointer = useCallback(() => {
    focusPanelRef.current = false;
    setOpen(true);
  }, [setOpen]);
  const context = useMemo<NavigationMenuItemContextValue>(
    () => ({
      close,
      contentId: `${baseId}-content`,
      focusPanelRef,
      layerId,
      open,
      openFromPointer,
      setOpen,
      triggerId: `${baseId}-trigger`,
      triggerRef,
    }),
    [baseId, close, layerId, open, openFromPointer, setOpen],
  );

  return (
    <NavigationMenuItemContext.Provider value={context}>
      <li
        {...props}
        ref={ref}
        className={classNames("combric-navigation-menu__item", className)}
        data-state={open ? "open" : "closed"}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (
            !event.defaultPrevented &&
            menu.openOnHover &&
            event.pointerType === "mouse"
          ) {
            openFromPointer();
          }
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (
            !event.defaultPrevented &&
            menu.openOnHover &&
            event.pointerType === "mouse"
          ) {
            close(false);
          }
        }}
      >
        {children}
      </li>
    </NavigationMenuItemContext.Provider>
  );
}

export interface NavigationMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  trailing?: ReactNode;
}

export function NavigationMenuTrigger({
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
}: NavigationMenuTriggerProps): ReactElement {
  const context = useNavigationMenuItemContext();

  return (
    <button
      {...props}
      ref={mergeRefs(context.triggerRef, ref)}
      id={context.triggerId}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      className={classNames("combric-navigation-menu__trigger", className)}
      data-state={context.open ? "open" : "closed"}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.focusPanelRef.current = false;
          context.setOpen(!context.open);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "ArrowDown") {
          return;
        }
        event.preventDefault();
        context.focusPanelRef.current = true;
        context.setOpen(true);
      }}
    >
      {leading === undefined ? null : (
        <span className="combric-navigation-menu__trigger-leading">
          {leading}
        </span>
      )}
      <span className="combric-navigation-menu__trigger-label">{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-navigation-menu__trigger-trailing">
          {trailing}
        </span>
      )}
    </button>
  );
}

export interface NavigationMenuContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role"
> {
  ref?: Ref<HTMLDivElement>;
}

function firstFocusableContentElement(
  content: HTMLElement,
): HTMLElement | null {
  return content.querySelector<HTMLElement>(
    "[autofocus], a[href], button:not(:disabled), input:not(:disabled):not([type='hidden']), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
  );
}

interface NavigationMenuPositionedContentProps extends NavigationMenuContentProps {
  itemContext: NavigationMenuItemContextValue;
}

function NavigationMenuPositionedContent({
  children,
  className,
  ref,
  style,
  itemContext: context,
  ...props
}: NavigationMenuPositionedContentProps): ReactElement {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const mergedContentRef = useMemo(() => mergeRefs(contentRef, ref), [ref]);

  useOverlayDismiss({
    active: true,
    contentRef,
    layerId: context.layerId,
    onEscape: () => context.close(true),
    onOutside: () => context.close(false),
    triggerRef: context.triggerRef,
  });

  useEffect(() => {
    if (!context.focusPanelRef.current) {
      return;
    }
    queueMicrotask(() => {
      const content = contentRef.current;
      if (content === null || !context.focusPanelRef.current) {
        return;
      }
      context.focusPanelRef.current = false;
      (firstFocusableContentElement(content) ?? content).focus();
    });
  }, [context.focusPanelRef]);

  return (
    <div
      {...props}
      ref={mergedContentRef}
      id={context.contentId}
      role="region"
      tabIndex={-1}
      aria-labelledby={context.triggerId}
      className={classNames("combric-navigation-menu__content", className)}
      data-presence="entered"
      data-state="open"
      style={style}
    >
      {children}
    </div>
  );
}

export function NavigationMenuContent(
  props: NavigationMenuContentProps,
): ReactElement | null {
  const context = useNavigationMenuItemContext();

  return context.open ? (
    <NavigationMenuPositionedContent {...props} itemContext={context} />
  ) : null;
}

export interface NavigationMenuLinkRenderProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  className: string;
  "data-state": "active" | "inactive";
  ref?: Ref<HTMLAnchorElement> | undefined;
}

export interface NavigationMenuLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  leading?: ReactNode;
  /** Renders a router-specific link without relying on asChild cloning. */
  render?: (props: NavigationMenuLinkRenderProps) => ReactElement;
  ref?: Ref<HTMLAnchorElement>;
  trailing?: ReactNode;
}

export function NavigationMenuLink({
  active = false,
  children,
  className,
  leading,
  ref,
  render,
  trailing,
  "aria-current": ariaCurrent,
  ...props
}: NavigationMenuLinkProps): ReactElement {
  useNavigationMenuContext();
  const linkProps: NavigationMenuLinkRenderProps = {
    ...props,
    ref,
    "aria-current": active ? (ariaCurrent ?? "page") : ariaCurrent,
    children: (
      <>
        {leading === undefined ? null : (
          <span className="combric-navigation-menu__link-leading">
            {leading}
          </span>
        )}
        <span className="combric-navigation-menu__link-label">{children}</span>
        {trailing === undefined ? null : (
          <span className="combric-navigation-menu__link-trailing">
            {trailing}
          </span>
        )}
      </>
    ),
    className: classNames("combric-navigation-menu__link", className),
    "data-state": active ? "active" : "inactive",
  };

  return (
    <li className="combric-navigation-menu__link-item">
      {render === undefined ? <a {...linkProps} /> : render(linkProps)}
    </li>
  );
}

/** MegaMenu is an ergonomic alias for a rich NavigationMenu panel. */
export const MegaMenu: typeof NavigationMenu = NavigationMenu;
export const MegaMenuList: typeof NavigationMenuList = NavigationMenuList;
export const MegaMenuItem: typeof NavigationMenuItem = NavigationMenuItem;
export const MegaMenuTrigger: typeof NavigationMenuTrigger =
  NavigationMenuTrigger;
export const MegaMenuContent: typeof NavigationMenuContent =
  NavigationMenuContent;
export const MegaMenuLink: typeof NavigationMenuLink = NavigationMenuLink;

export type MegaMenuProps = NavigationMenuProps;
export type MegaMenuListProps = NavigationMenuListProps;
export type MegaMenuItemProps = NavigationMenuItemProps;
export type MegaMenuTriggerProps = NavigationMenuTriggerProps;
export type MegaMenuContentProps = NavigationMenuContentProps;
export type MegaMenuLinkProps = NavigationMenuLinkProps;
export type MegaMenuLinkRenderProps = NavigationMenuLinkRenderProps;

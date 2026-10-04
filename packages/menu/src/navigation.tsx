"use client";

import {
  createContext,
  useContext,
  useId,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { useControllableOpen } from "@combric/react/overlay";

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

/**
 * Semantic website navigation. It deliberately uses native nav, list, and
 * link semantics rather than application-menu roles.
 */
export function Navigation({
  className,
  ref,
  ...props
}: NavigationProps): ReactElement {
  return (
    <nav
      {...props}
      ref={ref}
      className={classNames("combric-navigation", className)}
    />
  );
}

export type NavigationOrientation = "horizontal" | "vertical";

export interface NavigationListProps extends HTMLAttributes<HTMLUListElement> {
  orientation?: NavigationOrientation;
  ref?: Ref<HTMLUListElement>;
}

export function NavigationList({
  className,
  orientation = "horizontal",
  ref,
  ...props
}: NavigationListProps): ReactElement {
  return (
    <ul
      {...props}
      ref={ref}
      className={classNames("combric-navigation__list", className)}
      data-orientation={orientation}
    />
  );
}

export interface NavigationItemProps extends LiHTMLAttributes<HTMLLIElement> {
  ref?: Ref<HTMLLIElement>;
}

export function NavigationItem({
  className,
  ref,
  ...props
}: NavigationItemProps): ReactElement {
  return (
    <li
      {...props}
      ref={ref}
      className={classNames("combric-navigation__item", className)}
    />
  );
}

export interface NavigationLinkRenderProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  className: string;
  "data-state": "active" | "inactive";
  ref?: Ref<HTMLAnchorElement> | undefined;
}

export interface NavigationLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  leading?: ReactNode;
  /** Renders a router-specific link without relying on asChild cloning. */
  render?: (props: NavigationLinkRenderProps) => ReactElement;
  ref?: Ref<HTMLAnchorElement>;
  trailing?: ReactNode;
}

interface NavigationLinkBaseProps extends NavigationLinkProps {
  classNameBase: string;
}

function NavigationLinkBase({
  active = false,
  children,
  className,
  classNameBase,
  leading,
  ref,
  render,
  trailing,
  "aria-current": ariaCurrent,
  ...props
}: NavigationLinkBaseProps): ReactElement {
  const linkProps: NavigationLinkRenderProps = {
    ...props,
    ref,
    "aria-current": active ? (ariaCurrent ?? "page") : ariaCurrent,
    children: (
      <>
        {leading === undefined ? null : (
          <span className={`${classNameBase}-leading`}>{leading}</span>
        )}
        <span className={`${classNameBase}-label`}>{children}</span>
        {trailing === undefined ? null : (
          <span className={`${classNameBase}-trailing`}>{trailing}</span>
        )}
      </>
    ),
    className: classNames(classNameBase, className),
    "data-state": active ? "active" : "inactive",
  };

  return render === undefined ? <a {...linkProps} /> : render(linkProps);
}

export function NavigationLink(props: NavigationLinkProps): ReactElement {
  return (
    <NavigationLinkBase {...props} classNameBase="combric-navigation__link" />
  );
}

export interface SideNavProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

/**
 * A complementary surface for application or site navigation. Compose it
 * inside Drawer on compact viewports instead of introducing another drawer.
 */
export function SideNav({
  className,
  ref,
  ...props
}: SideNavProps): ReactElement {
  return (
    <aside
      {...props}
      ref={ref}
      className={classNames("combric-side-nav", className)}
    />
  );
}

export interface SideNavHeaderProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function SideNavHeader({
  className,
  ref,
  ...props
}: SideNavHeaderProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-side-nav__header", className)}
    />
  );
}

export interface SideNavContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function SideNavContent({
  className,
  ref,
  ...props
}: SideNavContentProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-side-nav__content", className)}
    />
  );
}

export interface SideNavFooterProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function SideNavFooter({
  className,
  ref,
  ...props
}: SideNavFooterProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-side-nav__footer", className)}
    />
  );
}

export type SideNavNavigationProps = NavigationProps;

export function SideNavNavigation({
  className,
  ...props
}: SideNavNavigationProps): ReactElement {
  return (
    <Navigation
      {...props}
      className={classNames("combric-side-nav__navigation", className)}
    />
  );
}

export type SideNavListProps = Omit<NavigationListProps, "orientation">;

export function SideNavList({
  className,
  ...props
}: SideNavListProps): ReactElement {
  return (
    <NavigationList
      {...props}
      orientation="vertical"
      className={classNames("combric-side-nav__list", className)}
    />
  );
}

export type SideNavItemProps = NavigationItemProps;

export function SideNavItem({
  className,
  ...props
}: SideNavItemProps): ReactElement {
  return (
    <NavigationItem
      {...props}
      className={classNames("combric-side-nav__item", className)}
    />
  );
}

export type SideNavLinkProps = NavigationLinkProps;

export function SideNavLink(props: SideNavLinkProps): ReactElement {
  return (
    <NavigationLinkBase {...props} classNameBase="combric-side-nav__link" />
  );
}

interface SideNavGroupContextValue {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
}

const SideNavGroupContext = createContext<SideNavGroupContextValue | null>(
  null,
);

function useSideNavGroupContext(): SideNavGroupContextValue {
  const context = useContext(SideNavGroupContext);
  if (context === null) {
    throw new Error(
      "SideNavGroupTrigger and SideNavGroupContent must be nested inside SideNavGroup.",
    );
  }
  return context;
}

export interface SideNavGroupProps
  extends PropsWithChildren, LiHTMLAttributes<HTMLLIElement> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  ref?: Ref<HTMLLIElement>;
}

export function SideNavGroup({
  children,
  className,
  defaultOpen,
  onOpenChange,
  open: openProp,
  ref,
  ...props
}: SideNavGroupProps): ReactElement {
  const [open, setOpen] = useControllableOpen({
    componentName: "SideNavGroup",
    defaultOpen,
    onOpenChange,
    open: openProp,
  });
  const baseId = `combric-side-nav-group-${useId().replaceAll(":", "")}`;

  return (
    <SideNavGroupContext.Provider
      value={{
        contentId: `${baseId}-content`,
        open,
        setOpen,
        triggerId: `${baseId}-trigger`,
      }}
    >
      <li
        {...props}
        ref={ref}
        className={classNames("combric-side-nav__group", className)}
        data-state={open ? "open" : "closed"}
      >
        {children}
      </li>
    </SideNavGroupContext.Provider>
  );
}

export interface SideNavGroupTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  trailing?: ReactNode;
}

export function SideNavGroupTrigger({
  children,
  className,
  leading,
  onClick,
  ref,
  trailing,
  type = "button",
  ...props
}: SideNavGroupTriggerProps): ReactElement {
  const context = useSideNavGroupContext();

  return (
    <button
      {...props}
      ref={ref}
      id={context.triggerId}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      className={classNames("combric-side-nav__group-trigger", className)}
      data-state={context.open ? "open" : "closed"}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.setOpen(!context.open);
        }
      }}
    >
      {leading === undefined ? null : (
        <span className="combric-side-nav__group-leading">{leading}</span>
      )}
      <span className="combric-side-nav__group-label">{children}</span>
      {trailing === undefined ? null : (
        <span className="combric-side-nav__group-trailing">{trailing}</span>
      )}
    </button>
  );
}

export interface SideNavGroupContentProps extends HTMLAttributes<HTMLUListElement> {
  ref?: Ref<HTMLUListElement>;
}

export function SideNavGroupContent({
  className,
  ref,
  ...props
}: SideNavGroupContentProps): ReactElement {
  const context = useSideNavGroupContext();

  return (
    <ul
      {...props}
      ref={ref}
      id={context.contentId}
      aria-labelledby={context.triggerId}
      className={classNames("combric-side-nav__group-content", className)}
      data-state={context.open ? "open" : "closed"}
      hidden={!context.open}
      inert={!context.open}
    />
  );
}

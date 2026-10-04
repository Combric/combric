"use client";

import {
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

function classNames(
  ...names: Array<string | false | null | undefined>
): string {
  return names.filter((name): name is string => Boolean(name)).join(" ");
}

export interface BottomNavigationProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

/**
 * A semantic mobile-oriented navigation surface. Positioning is deliberately
 * left to the consumer so it can compose with safe areas and application shells.
 */
export function BottomNavigation({
  className,
  ref,
  ...props
}: BottomNavigationProps): ReactElement {
  return (
    <nav
      {...props}
      ref={ref}
      className={classNames("combric-bottom-navigation", className)}
    />
  );
}

export interface BottomNavigationListProps extends HTMLAttributes<HTMLUListElement> {
  ref?: Ref<HTMLUListElement>;
}

export function BottomNavigationList({
  className,
  ref,
  ...props
}: BottomNavigationListProps): ReactElement {
  return (
    <ul
      {...props}
      ref={ref}
      className={classNames("combric-bottom-navigation__list", className)}
    />
  );
}

export interface BottomNavigationLinkRenderProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  className: string;
  "data-state": "active" | "inactive";
  ref?: Ref<HTMLAnchorElement> | undefined;
}

export interface BottomNavigationLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  leading?: ReactNode;
  /** Renders a router-specific link without relying on asChild cloning. */
  render?: (props: BottomNavigationLinkRenderProps) => ReactElement;
  ref?: Ref<HTMLAnchorElement>;
  trailing?: ReactNode;
}

export function BottomNavigationLink({
  active = false,
  children,
  className,
  leading,
  ref,
  render,
  trailing,
  "aria-current": ariaCurrent,
  ...props
}: BottomNavigationLinkProps): ReactElement {
  const linkProps: BottomNavigationLinkRenderProps = {
    ...props,
    ref,
    "aria-current": active ? (ariaCurrent ?? "page") : ariaCurrent,
    children: (
      <>
        {leading === undefined ? null : (
          <span className="combric-bottom-navigation__link-leading">
            {leading}
          </span>
        )}
        <span className="combric-bottom-navigation__link-label">
          {children}
        </span>
        {trailing === undefined ? null : (
          <span className="combric-bottom-navigation__link-trailing">
            {trailing}
          </span>
        )}
      </>
    ),
    className: classNames("combric-bottom-navigation__link", className),
    "data-state": active ? "active" : "inactive",
  };

  return (
    <li className="combric-bottom-navigation__item">
      {render === undefined ? <a {...linkProps} /> : render(linkProps)}
    </li>
  );
}

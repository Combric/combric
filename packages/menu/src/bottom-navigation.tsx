"use client";

import {
  type AnchorHTMLAttributes,
  type CSSProperties,
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
  /** Optional external spacing for this navigation surface. */
  margin?: CSSProperties["margin"];
  /** Optional internal spacing for this navigation surface. */
  padding?: CSSProperties["padding"];
  ref?: Ref<HTMLElement>;
}

/**
 * A semantic mobile-oriented navigation surface. Positioning is deliberately
 * left to the consumer so it can compose with safe areas and application shells.
 */
export function BottomNavigation({
  className,
  margin,
  padding,
  ref,
  style,
  ...props
}: BottomNavigationProps): ReactElement {
  return (
    <nav
      {...props}
      ref={ref}
      className={classNames("combric-bottom-navigation", className)}
      style={{ margin, padding, ...style }}
    />
  );
}

export interface BottomNavigationListProps extends HTMLAttributes<HTMLUListElement> {
  /** Optional gap between navigation items. */
  gap?: CSSProperties["gap"];
  /** Optional external spacing for the item list. */
  margin?: CSSProperties["margin"];
  /** Optional internal spacing for the item list. */
  padding?: CSSProperties["padding"];
  ref?: Ref<HTMLUListElement>;
}

export function BottomNavigationList({
  className,
  gap,
  margin,
  padding,
  ref,
  style,
  ...props
}: BottomNavigationListProps): ReactElement {
  return (
    <ul
      {...props}
      ref={ref}
      className={classNames("combric-bottom-navigation__list", className)}
      style={{ gap, margin, padding, ...style }}
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
  /** Overrides children when a label needs to be supplied separately. */
  label?: ReactNode;
  /** Class name applied only to the text label. */
  labelClassName?: string;
  /** Inline style applied only to the text label. */
  labelStyle?: CSSProperties;
  leading?: ReactNode;
  /** Optional external spacing for this link. */
  margin?: CSSProperties["margin"];
  /** Optional internal spacing for this link. */
  padding?: CSSProperties["padding"];
  /** Renders a router-specific link without relying on asChild cloning. */
  render?: (props: BottomNavigationLinkRenderProps) => ReactElement;
  ref?: Ref<HTMLAnchorElement>;
  trailing?: ReactNode;
}

export function BottomNavigationLink({
  active = false,
  children,
  className,
  label,
  labelClassName,
  labelStyle,
  leading,
  margin,
  padding,
  ref,
  render,
  style,
  trailing,
  "aria-current": ariaCurrent,
  ...props
}: BottomNavigationLinkProps): ReactElement {
  const linkProps: BottomNavigationLinkRenderProps = {
    ...props,
    ref,
    "aria-current": active ? (ariaCurrent ?? "page") : ariaCurrent,
    style: { margin, padding, ...style },
    children: (
      <>
        {leading === undefined ? null : (
          <span className="combric-bottom-navigation__link-leading">
            {leading}
          </span>
        )}
        <span
          className={classNames(
            "combric-bottom-navigation__link-label",
            labelClassName,
          )}
          style={labelStyle}
        >
          {label ?? children}
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

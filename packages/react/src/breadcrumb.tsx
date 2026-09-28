import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
  ReactElement,
  Ref,
} from "react";

import { classNames } from "./class-names.js";
import { renderIconSlot, type IconSlot } from "./icon-slots.js";

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function Breadcrumb({
  "aria-label": ariaLabel = "Breadcrumb",
  className,
  ref,
  ...props
}: BreadcrumbProps): ReactElement {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      className={classNames("combric-breadcrumb", className)}
    />
  );
}

export interface BreadcrumbListProps extends HTMLAttributes<HTMLOListElement> {
  ref?: Ref<HTMLOListElement>;
}

export function BreadcrumbList({
  className,
  ref,
  ...props
}: BreadcrumbListProps): ReactElement {
  return (
    <ol
      {...props}
      ref={ref}
      className={classNames("combric-breadcrumb__list", className)}
    />
  );
}

export interface BreadcrumbItemProps extends LiHTMLAttributes<HTMLLIElement> {
  ref?: Ref<HTMLLIElement>;
}

export function BreadcrumbItem({
  className,
  ref,
  ...props
}: BreadcrumbItemProps): ReactElement {
  return (
    <li
      {...props}
      ref={ref}
      className={classNames("combric-breadcrumb__item", className)}
    />
  );
}

export interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  leadingIcon?: IconSlot;
  ref?: Ref<HTMLAnchorElement>;
  trailingIcon?: IconSlot;
}

export function BreadcrumbLink({
  className,
  leadingIcon,
  ref,
  trailingIcon,
  children,
  ...props
}: BreadcrumbLinkProps): ReactElement {
  return (
    <a
      {...props}
      ref={ref}
      className={classNames("combric-breadcrumb__link", className)}
    >
      {renderIconSlot(leadingIcon, "leading")}
      {children}
      {renderIconSlot(trailingIcon, "trailing")}
    </a>
  );
}

export interface BreadcrumbSeparatorProps extends LiHTMLAttributes<HTMLLIElement> {
  icon?: IconSlot;
  ref?: Ref<HTMLLIElement>;
}

export function BreadcrumbSeparator({
  children = "/",
  className,
  icon,
  ref,
  ...props
}: BreadcrumbSeparatorProps): ReactElement {
  return (
    <li
      {...props}
      ref={ref}
      aria-hidden="true"
      className={classNames("combric-breadcrumb__separator", className)}
      role="presentation"
    >
      {icon === undefined ? children : renderIconSlot(icon, "icon")}
    </li>
  );
}

export interface BreadcrumbPageProps extends HTMLAttributes<HTMLSpanElement> {
  leadingIcon?: IconSlot;
  ref?: Ref<HTMLSpanElement>;
  trailingIcon?: IconSlot;
}

export function BreadcrumbPage({
  className,
  leadingIcon,
  ref,
  trailingIcon,
  children,
  ...props
}: BreadcrumbPageProps): ReactElement {
  return (
    <span
      {...props}
      ref={ref}
      aria-current="page"
      className={classNames("combric-breadcrumb__page", className)}
    >
      {renderIconSlot(leadingIcon, "leading")}
      {children}
      {renderIconSlot(trailingIcon, "trailing")}
    </span>
  );
}

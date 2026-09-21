import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  LiHTMLAttributes,
  ReactElement,
  Ref,
} from "react";

import { classNames } from "./class-names.js";

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function Pagination({
  "aria-label": ariaLabel = "Pagination",
  className,
  ref,
  ...props
}: PaginationProps): ReactElement {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={ariaLabel}
      className={classNames("combric-pagination", className)}
    />
  );
}

export interface PaginationListProps extends HTMLAttributes<HTMLUListElement> {
  ref?: Ref<HTMLUListElement>;
}

export function PaginationList({
  className,
  ref,
  ...props
}: PaginationListProps): ReactElement {
  return (
    <ul
      {...props}
      ref={ref}
      className={classNames("combric-pagination__list", className)}
    />
  );
}

export interface PaginationItemProps extends LiHTMLAttributes<HTMLLIElement> {
  ref?: Ref<HTMLLIElement>;
}

export function PaginationItem({
  className,
  ref,
  ...props
}: PaginationItemProps): ReactElement {
  return (
    <li
      {...props}
      ref={ref}
      className={classNames("combric-pagination__item", className)}
    />
  );
}

export interface PaginationLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  current?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

export function PaginationLink({
  className,
  current = false,
  disabled = false,
  href,
  onClick,
  ref,
  ...props
}: PaginationLinkProps): ReactElement {
  return (
    <a
      {...props}
      ref={ref}
      href={disabled ? undefined : href}
      aria-current={current ? "page" : undefined}
      aria-disabled={disabled || undefined}
      className={classNames("combric-pagination__link", className)}
      data-current={current ? "" : undefined}
      tabIndex={disabled ? -1 : props.tabIndex}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}

export type PaginationPreviousProps = PaginationLinkProps;

export function PaginationPrevious({
  "aria-label": ariaLabel = "Previous page",
  children = "Previous",
  ...props
}: PaginationPreviousProps): ReactElement {
  return (
    <PaginationLink {...props} aria-label={ariaLabel}>
      {children}
    </PaginationLink>
  );
}

export type PaginationNextProps = PaginationLinkProps;

export function PaginationNext({
  "aria-label": ariaLabel = "Next page",
  children = "Next",
  ...props
}: PaginationNextProps): ReactElement {
  return (
    <PaginationLink {...props} aria-label={ariaLabel}>
      {children}
    </PaginationLink>
  );
}

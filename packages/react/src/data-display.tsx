import {
  type HTMLAttributes,
  type ReactElement,
  type Ref,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

import { classNames } from "./class-names.js";

export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function TableContainer({
  className,
  ref,
  ...props
}: TableContainerProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-table-container", className)}
      tabIndex={props.tabIndex ?? 0}
    />
  );
}

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  ref?: Ref<HTMLTableElement>;
}

export function Table({ className, ref, ...props }: TableProps): ReactElement {
  return (
    <table
      {...props}
      ref={ref}
      className={classNames("combric-table", className)}
    />
  );
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  ref?: Ref<HTMLTableSectionElement>;
}

export function TableHeader({
  className,
  ref,
  ...props
}: TableHeaderProps): ReactElement {
  return (
    <thead
      {...props}
      ref={ref}
      className={classNames("combric-table__header", className)}
    />
  );
}

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  ref?: Ref<HTMLTableSectionElement>;
}

export function TableBody({
  className,
  ref,
  ...props
}: TableBodyProps): ReactElement {
  return (
    <tbody
      {...props}
      ref={ref}
      className={classNames("combric-table__body", className)}
    />
  );
}

export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {
  ref?: Ref<HTMLTableSectionElement>;
}

export function TableFooter({
  className,
  ref,
  ...props
}: TableFooterProps): ReactElement {
  return (
    <tfoot
      {...props}
      ref={ref}
      className={classNames("combric-table__footer", className)}
    />
  );
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  ref?: Ref<HTMLTableRowElement>;
}

export function TableRow({
  className,
  ref,
  ...props
}: TableRowProps): ReactElement {
  return (
    <tr
      {...props}
      ref={ref}
      className={classNames("combric-table__row", className)}
    />
  );
}

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  ref?: Ref<HTMLTableCellElement>;
}

export function TableHead({
  className,
  ref,
  scope = "col",
  ...props
}: TableHeadProps): ReactElement {
  return (
    <th
      {...props}
      ref={ref}
      scope={scope}
      className={classNames("combric-table__head", className)}
    />
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  ref?: Ref<HTMLTableCellElement>;
}

export function TableCell({
  className,
  ref,
  ...props
}: TableCellProps): ReactElement {
  return (
    <td
      {...props}
      ref={ref}
      className={classNames("combric-table__cell", className)}
    />
  );
}

export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {
  ref?: Ref<HTMLTableCaptionElement>;
}

export function TableCaption({
  className,
  ref,
  ...props
}: TableCaptionProps): ReactElement {
  return (
    <caption
      {...props}
      ref={ref}
      className={classNames("combric-table__caption", className)}
    />
  );
}

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  ref?: Ref<HTMLDListElement>;
}

export function DescriptionList({
  className,
  ref,
  ...props
}: DescriptionListProps): ReactElement {
  return (
    <dl
      {...props}
      ref={ref}
      className={classNames("combric-description-list", className)}
    />
  );
}

export interface DescriptionTermProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function DescriptionTerm({
  className,
  ref,
  ...props
}: DescriptionTermProps): ReactElement {
  return (
    <dt
      {...props}
      ref={ref}
      className={classNames("combric-description-list__term", className)}
    />
  );
}

export interface DescriptionDetailsProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function DescriptionDetails({
  className,
  ref,
  ...props
}: DescriptionDetailsProps): ReactElement {
  return (
    <dd
      {...props}
      ref={ref}
      className={classNames("combric-description-list__details", className)}
    />
  );
}

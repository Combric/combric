import type { HTMLAttributes, ReactElement, Ref } from "react";

import { classNames } from "./class-names.js";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function Card({ className, ref, ...props }: CardProps): ReactElement {
  return (
    <section
      {...props}
      ref={ref}
      className={classNames("combric-card", className)}
    />
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function CardHeader({
  className,
  ref,
  ...props
}: CardHeaderProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-card__header", className)}
    />
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLHeadingElement>;
}

export function CardTitle({
  className,
  ref,
  ...props
}: CardTitleProps): ReactElement {
  return (
    <h2
      {...props}
      ref={ref}
      className={classNames("combric-card__title", className)}
    />
  );
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function CardDescription({
  className,
  ref,
  ...props
}: CardDescriptionProps): ReactElement {
  return (
    <p
      {...props}
      ref={ref}
      className={classNames("combric-card__description", className)}
    />
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function CardContent({
  className,
  ref,
  ...props
}: CardContentProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-card__content", className)}
    />
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

export function CardFooter({
  className,
  ref,
  ...props
}: CardFooterProps): ReactElement {
  return (
    <footer
      {...props}
      ref={ref}
      className={classNames("combric-card__footer", className)}
    />
  );
}

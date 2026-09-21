"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";

type AccordionValue = string | null;

interface AccordionContextValue {
  currentValue: AccordionValue;
  setValue: (value: AccordionValue) => void;
}

interface AccordionItemContextValue {
  contentId: string;
  disabled: boolean;
  open: boolean;
  triggerId: string;
  value: string;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

function useAccordionContext(): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (context === null) {
    throw new Error("Accordion components must be nested inside Accordion.");
  }
  return context;
}

function useAccordionItemContext(): AccordionItemContextValue {
  const context = useContext(AccordionItemContext);
  if (context === null) {
    throw new Error(
      "AccordionTrigger and AccordionContent must be nested inside AccordionItem.",
    );
  }
  return context;
}

export interface AccordionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> {
  defaultValue?: AccordionValue;
  onValueChange?: (value: AccordionValue) => void;
  ref?: Ref<HTMLDivElement>;
  value?: AccordionValue;
}

export function Accordion({
  className,
  defaultValue = null,
  onValueChange,
  ref,
  value,
  ...props
}: AccordionProps): ReactElement {
  const controlled = value !== undefined;
  const initialControlled = useRef(controlled);
  const [uncontrolledValue, setUncontrolledValue] =
    useState<AccordionValue>(defaultValue);

  if (initialControlled.current !== controlled) {
    throw new Error(
      "Accordion cannot switch between controlled and uncontrolled modes.",
    );
  }

  const currentValue: AccordionValue = controlled
    ? (value ?? null)
    : uncontrolledValue;

  function setValue(nextValue: AccordionValue): void {
    if (!controlled) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  return (
    <AccordionContext.Provider value={{ currentValue, setValue }}>
      <div
        {...props}
        ref={ref}
        className={classNames("combric-accordion", className)}
      />
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
  value: string;
}

export function AccordionItem({
  className,
  disabled = false,
  ref,
  value,
  ...props
}: AccordionItemProps): ReactElement {
  const { currentValue } = useAccordionContext();
  const reactId = useId().replaceAll(":", "");
  const open = currentValue === value;
  const triggerId = `combric-accordion-trigger-${reactId}`;
  const contentId = `combric-accordion-content-${reactId}`;

  return (
    <AccordionItemContext.Provider
      value={{ contentId, disabled, open, triggerId, value }}
    >
      <div
        {...props}
        ref={ref}
        className={classNames("combric-accordion__item", className)}
        data-disabled={disabled ? "" : undefined}
        data-state={open ? "open" : "closed"}
      />
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

export function AccordionTrigger({
  className,
  disabled: disabledProp,
  onClick,
  ref,
  type = "button",
  ...props
}: AccordionTriggerProps): ReactElement {
  const { setValue } = useAccordionContext();
  const { contentId, disabled, open, triggerId, value } =
    useAccordionItemContext();
  const isDisabled = disabled || Boolean(disabledProp);

  return (
    <button
      {...props}
      ref={ref}
      id={triggerId}
      type={type}
      aria-controls={contentId}
      aria-expanded={open}
      className={classNames("combric-accordion__trigger", className)}
      data-state={open ? "open" : "closed"}
      disabled={isDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setValue(open ? null : value);
        }
      }}
    />
  );
}

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function AccordionContent({
  className,
  ref,
  ...props
}: AccordionContentProps): ReactElement {
  const { contentId, open, triggerId } = useAccordionItemContext();

  return (
    <div
      {...props}
      ref={ref}
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      className={classNames("combric-accordion__content", className)}
      data-state={open ? "open" : "closed"}
      hidden={!open}
    />
  );
}

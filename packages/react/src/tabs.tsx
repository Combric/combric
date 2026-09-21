"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";

interface TabsContextValue {
  baseId: string;
  setValue: (value: string) => void;
  value: string | null;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === null) {
    throw new Error("Tabs components must be nested inside Tabs.");
  }
  return context;
}

function valueId(value: string): string {
  return Array.from(value, (character) =>
    character.codePointAt(0)?.toString(16),
  ).join("-");
}

function tabId(baseId: string, value: string): string {
  return `${baseId}-tab-${valueId(value)}`;
}

function panelId(baseId: string, value: string): string {
  return `${baseId}-panel-${valueId(value)}`;
}

export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ref?: Ref<HTMLDivElement>;
  value?: string;
}

export function Tabs({
  className,
  defaultValue,
  onValueChange,
  ref,
  value,
  ...props
}: TabsProps): ReactElement {
  const controlled = value !== undefined;
  const initialControlled = useRef(controlled);
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    defaultValue ?? null,
  );
  const baseId = `combric-tabs-${useId().replaceAll(":", "")}`;

  if (initialControlled.current !== controlled) {
    throw new Error(
      "Tabs cannot switch between controlled and uncontrolled modes.",
    );
  }

  const currentValue = controlled ? (value ?? null) : uncontrolledValue;

  function setValue(nextValue: string): void {
    if (!controlled) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  return (
    <TabsContext.Provider value={{ baseId, setValue, value: currentValue }}>
      <div
        {...props}
        ref={ref}
        className={classNames("combric-tabs", className)}
      />
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function TabsList({
  className,
  ref,
  ...props
}: TabsListProps): ReactElement {
  useTabsContext();
  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      className={classNames("combric-tabs__list", className)}
    />
  );
}

export interface TabsTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  ref?: Ref<HTMLButtonElement>;
  value: string;
}

export function TabsTrigger({
  className,
  disabled = false,
  onClick,
  onKeyDown,
  ref,
  type = "button",
  value,
  ...props
}: TabsTriggerProps): ReactElement {
  const context = useTabsContext();
  const selected = context.value === value;

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>): void {
    const list = event.currentTarget.closest('[role="tablist"]');
    const tabs = Array.from(
      list?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ) ?? [],
    );
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0 || tabs.length === 0) {
      return;
    }

    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        nextTab.focus();
        const nextValue = nextTab.dataset.value;
        if (nextValue !== undefined) {
          context.setValue(nextValue);
        }
      }
    }
  }

  return (
    <button
      {...props}
      ref={ref}
      id={tabId(context.baseId, value)}
      type={type}
      role="tab"
      aria-controls={panelId(context.baseId, value)}
      aria-selected={selected}
      className={classNames("combric-tabs__trigger", className)}
      data-state={selected ? "active" : "inactive"}
      data-value={value}
      disabled={disabled}
      tabIndex={selected ? 0 : -1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.setValue(value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) {
          moveFocus(event);
        }
      }}
    />
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  value: string;
}

export function TabsContent({
  className,
  ref,
  value,
  ...props
}: TabsContentProps): ReactElement {
  const context = useTabsContext();
  const selected = context.value === value;

  return (
    <div
      {...props}
      ref={ref}
      id={panelId(context.baseId, value)}
      role="tabpanel"
      aria-labelledby={tabId(context.baseId, value)}
      className={classNames("combric-tabs__content", className)}
      data-state={selected ? "active" : "inactive"}
      hidden={!selected}
      tabIndex={0}
    />
  );
}

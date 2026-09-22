"use client";

import {
  createContext,
  useContext,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";
import { useControllableState } from "./controllable-state.js";

interface CollapsibleContextValue {
  contentId: string;
  disabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(): CollapsibleContextValue {
  const context = useContext(CollapsibleContext);
  if (context === null) {
    throw new Error(
      "CollapsibleTrigger and CollapsibleContent must be nested inside Collapsible.",
    );
  }
  return context;
}

export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function Collapsible({
  className,
  defaultOpen = false,
  disabled = false,
  onOpenChange,
  open,
  ref,
  ...props
}: CollapsibleProps): ReactElement {
  const [currentOpen, setOpen] = useControllableState({
    componentName: "Collapsible",
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: open,
  });
  const reactId = useId().replaceAll(":", "");

  return (
    <CollapsibleContext.Provider
      value={{
        contentId: `combric-collapsible-content-${reactId}`,
        disabled,
        open: currentOpen,
        setOpen,
        triggerId: `combric-collapsible-trigger-${reactId}`,
      }}
    >
      <div
        {...props}
        ref={ref}
        className={classNames("combric-collapsible", className)}
        data-disabled={disabled ? "" : undefined}
        data-state={currentOpen ? "open" : "closed"}
      />
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

export function CollapsibleTrigger({
  className,
  disabled: disabledProp = false,
  onClick,
  ref,
  type = "button",
  ...props
}: CollapsibleTriggerProps): ReactElement {
  const context = useCollapsibleContext();
  return (
    <button
      {...props}
      ref={ref}
      id={context.triggerId}
      type={type}
      aria-controls={context.contentId}
      aria-expanded={context.open}
      className={classNames("combric-collapsible__trigger", className)}
      data-state={context.open ? "open" : "closed"}
      disabled={context.disabled || disabledProp}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.setOpen(!context.open);
        }
      }}
    />
  );
}

export interface CollapsibleContentProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function CollapsibleContent({
  className,
  ref,
  ...props
}: CollapsibleContentProps): ReactElement {
  const context = useCollapsibleContext();
  return (
    <div
      {...props}
      ref={ref}
      id={context.contentId}
      role="region"
      aria-labelledby={context.triggerId}
      className={classNames("combric-collapsible__content", className)}
      data-state={context.open ? "open" : "closed"}
      hidden={!context.open}
    />
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";
import { useControllableState } from "./controllable-state.js";

export interface ToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-pressed"
> {
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  pressed?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Toggle({
  className,
  defaultPressed = false,
  onClick,
  onPressedChange,
  pressed,
  ref,
  type = "button",
  ...props
}: ToggleProps): ReactElement {
  const [currentPressed, setPressed] = useControllableState({
    componentName: "Toggle",
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    value: pressed,
  });

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      aria-pressed={currentPressed}
      className={classNames("combric-toggle", className)}
      data-state={currentPressed ? "on" : "off"}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setPressed(!currentPressed);
        }
      }}
    />
  );
}

export type ToggleGroupOrientation = "horizontal" | "vertical";

interface ToggleGroupContextValue {
  activeValue: string | null;
  disabled: boolean;
  orientation: ToggleGroupOrientation;
  registerItem: (value: string, element: HTMLButtonElement | null) => void;
  select: (value: string) => void;
  selectedValues: readonly string[];
  setActiveValue: (value: string) => void;
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext(): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext);
  if (context === null) {
    throw new Error("ToggleGroupItem must be nested inside ToggleGroup.");
  }
  return context;
}

interface ToggleGroupBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  disabled?: boolean;
  orientation?: ToggleGroupOrientation;
  ref?: Ref<HTMLDivElement>;
}

export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  type: "single";
  value?: string;
}

export interface ToggleGroupMultipleProps extends ToggleGroupBaseProps {
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  type: "multiple";
  value?: string[];
}

export type ToggleGroupProps =
  ToggleGroupMultipleProps | ToggleGroupSingleProps;

export function ToggleGroup(props: ToggleGroupProps): ReactElement {
  const {
    className,
    defaultValue,
    disabled = false,
    onValueChange,
    orientation = "horizontal",
    ref,
    type,
    value,
    ...rootProps
  } = props;
  const normalizedValue =
    value === undefined
      ? undefined
      : type === "single"
        ? value === ""
          ? []
          : [value]
        : value;
  const normalizedDefault =
    type === "single"
      ? defaultValue === undefined || defaultValue === ""
        ? []
        : [defaultValue]
      : (defaultValue ?? []);
  const [selectedValues, setSelectedValues] = useControllableState<string[]>({
    componentName: "ToggleGroup",
    defaultValue: normalizedDefault,
    onChange: (nextValues) => {
      if (type === "single") {
        (onValueChange as ToggleGroupSingleProps["onValueChange"])?.(
          nextValues[0] ?? "",
        );
      } else {
        (onValueChange as ToggleGroupMultipleProps["onValueChange"])?.(
          nextValues,
        );
      }
    },
    value: normalizedValue,
  });
  const itemsRef = useRef(new Map<string, HTMLButtonElement>());
  const [activeValue, setActiveValueState] = useState<string | null>(
    selectedValues[0] ?? null,
  );

  const firstEnabledValue = useCallback((): string | null => {
    return (
      [...itemsRef.current.entries()].find(([, item]) => !item.disabled)?.[0] ??
      null
    );
  }, []);

  const registerItem = useCallback(
    (valueKey: string, element: HTMLButtonElement | null): void => {
      if (element === null) {
        itemsRef.current.delete(valueKey);
        setActiveValueState((currentValue) =>
          currentValue === valueKey ? firstEnabledValue() : currentValue,
        );
        return;
      }
      itemsRef.current.set(valueKey, element);
      if (!element.disabled) {
        setActiveValueState((currentValue) => currentValue ?? valueKey);
      }
    },
    [firstEnabledValue],
  );

  function select(valueKey: string): void {
    if (type === "single") {
      setSelectedValues(selectedValues.includes(valueKey) ? [] : [valueKey]);
      return;
    }
    setSelectedValues(
      selectedValues.includes(valueKey)
        ? selectedValues.filter((item) => item !== valueKey)
        : [...selectedValues, valueKey],
    );
  }

  return (
    <ToggleGroupContext.Provider
      value={{
        activeValue,
        disabled,
        orientation,
        registerItem,
        select,
        selectedValues,
        setActiveValue: setActiveValueState,
      }}
    >
      <div
        {...rootProps}
        ref={ref}
        role="group"
        className={classNames("combric-toggle-group", className)}
        data-disabled={disabled ? "" : undefined}
        data-orientation={orientation}
      />
    </ToggleGroupContext.Provider>
  );
}

export interface ToggleGroupItemProps extends Omit<
  ToggleProps,
  "defaultPressed" | "onPressedChange" | "pressed"
> {
  value: string;
}

export function ToggleGroupItem({
  className,
  disabled: disabledProp = false,
  onClick,
  onKeyDown,
  ref,
  type = "button",
  value,
  ...props
}: ToggleGroupItemProps): ReactElement {
  const context = useToggleGroupContext();
  const itemRef = useRef<HTMLButtonElement | null>(null);
  const selected = context.selectedValues.includes(value);
  const disabled = context.disabled || disabledProp;
  const setRefs = useCallback(
    (element: HTMLButtonElement | null): void => {
      itemRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    },
    [ref],
  );

  useEffect(() => {
    context.registerItem(value, itemRef.current);
    return () => context.registerItem(value, null);
  }, [context.registerItem, disabled, value]);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>): void {
    const group = event.currentTarget.closest('[role="group"]');
    const items = Array.from(
      group?.querySelectorAll<HTMLButtonElement>(
        ".combric-toggle-group__item:not(:disabled)",
      ) ?? [],
    );
    const currentIndex = items.indexOf(event.currentTarget);
    if (currentIndex < 0 || items.length === 0) {
      return;
    }

    const forwardKey =
      context.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backwardKey =
      context.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    let nextIndex: number | undefined;
    if (event.key === forwardKey) {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === backwardKey) {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    const nextItem = nextIndex === undefined ? undefined : items[nextIndex];
    if (nextItem) {
      event.preventDefault();
      const nextValue = nextItem.dataset.value;
      if (nextValue !== undefined) {
        context.setActiveValue(nextValue);
      }
      nextItem.focus();
    }
  }

  return (
    <button
      {...props}
      ref={setRefs}
      type={type}
      aria-pressed={selected}
      className={classNames("combric-toggle-group__item", className)}
      data-state={selected ? "on" : "off"}
      data-value={value}
      disabled={disabled}
      tabIndex={context.activeValue === value ? 0 : -1}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.setActiveValue(value);
          context.select(value);
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

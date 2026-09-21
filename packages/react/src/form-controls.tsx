"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { classNames } from "./class-names.js";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  ref?: Ref<HTMLLabelElement>;
}

export function Label({ className, ref, ...props }: LabelProps): ReactElement {
  return (
    <label
      {...props}
      ref={ref}
      className={classNames("combric-label", className)}
    />
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, ref, ...props }: InputProps): ReactElement {
  return (
    <input
      {...props}
      ref={ref}
      className={classNames("combric-input", className)}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  className,
  ref,
  ...props
}: TextareaProps): ReactElement {
  return (
    <textarea
      {...props}
      ref={ref}
      className={classNames("combric-textarea", className)}
    />
  );
}

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  className,
  ref,
  ...props
}: CheckboxProps): ReactElement {
  return (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={classNames("combric-checkbox", className)}
    />
  );
}

interface RadioGroupContextValue {
  disabled: boolean;
  name: string;
  required: boolean;
  setValue: (value: string) => void;
  value: string | null;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "onChange"
> {
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  ref?: Ref<HTMLFieldSetElement>;
  required?: boolean;
  value?: string;
}

export function RadioGroup({
  className,
  defaultValue,
  disabled = false,
  name,
  onValueChange,
  ref,
  required = false,
  value,
  ...props
}: RadioGroupProps): ReactElement {
  const generatedName = `combric-radio-${useId().replaceAll(":", "")}`;
  const controlled = value !== undefined;
  const initialControlled = useRef(controlled);
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    defaultValue ?? null,
  );

  if (initialControlled.current !== controlled) {
    throw new Error(
      "RadioGroup cannot switch between controlled and uncontrolled modes.",
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
    <RadioGroupContext.Provider
      value={{
        disabled,
        name: name ?? generatedName,
        required,
        setValue,
        value: currentValue,
      }}
    >
      <fieldset
        {...props}
        ref={ref}
        className={classNames("combric-radio-group", className)}
        disabled={disabled}
      />
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "name" | "type" | "value"
> {
  ref?: Ref<HTMLInputElement>;
  value: string;
}

export function Radio({
  className,
  disabled: disabledProp,
  onChange,
  ref,
  required: requiredProp,
  value,
  ...props
}: RadioProps): ReactElement {
  const context = useContext(RadioGroupContext);
  if (context === null) {
    throw new Error("Radio must be nested inside RadioGroup.");
  }
  const disabled = context.disabled || Boolean(disabledProp);

  return (
    <input
      {...props}
      ref={ref}
      type="radio"
      className={classNames("combric-radio", className)}
      checked={context.value === value}
      disabled={disabled}
      name={context.name}
      required={context.required || Boolean(requiredProp)}
      value={value}
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented && event.currentTarget.checked) {
          context.setValue(value);
        }
      }}
    />
  );
}

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "role" | "type"
> {
  ref?: Ref<HTMLInputElement>;
}

export function Switch({
  className,
  ref,
  ...props
}: SwitchProps): ReactElement {
  return (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      role="switch"
      className={classNames("combric-switch", className)}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
}

export function Select({
  className,
  ref,
  ...props
}: SelectProps): ReactElement {
  return (
    <select
      {...props}
      ref={ref}
      className={classNames("combric-select", className)}
    />
  );
}

"use client";

import { useRef, useState } from "react";

export function useControllableState<T>({
  componentName,
  defaultValue,
  onChange,
  value,
}: {
  componentName: string;
  defaultValue: T;
  onChange: ((value: T) => void) | undefined;
  value: T | undefined;
}): readonly [T, (value: T) => void] {
  const controlled = value !== undefined;
  const initialControlled = useRef(controlled);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  if (initialControlled.current !== controlled) {
    throw new Error(
      `${componentName} cannot switch between controlled and uncontrolled modes.`,
    );
  }

  const currentValue = controlled ? value : uncontrolledValue;

  function setValue(nextValue: T): void {
    if (!controlled) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
  }

  return [currentValue, setValue] as const;
}

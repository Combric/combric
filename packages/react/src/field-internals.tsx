"use client";

import {
  createContext,
  useContext,
  type Context,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface FieldContextValue {
  controlId: string;
  defaultDescriptionId: string;
  defaultMessageId: string;
  descriptionId: string | undefined;
  invalid: boolean;
  labelId: string;
  messageId: string | undefined;
  setDescriptionId: Dispatch<SetStateAction<string | undefined>>;
  setMessageId: Dispatch<SetStateAction<string | undefined>>;
}

export const FieldContext: Context<FieldContextValue | null> =
  createContext<FieldContextValue | null>(null);

export function useOptionalFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

export function mergeAriaTokens(
  ...values: Array<string | undefined>
): string | undefined {
  const tokens = values.flatMap((value) => value?.split(/\s+/) ?? []);
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  return uniqueTokens.length > 0 ? uniqueTokens.join(" ") : undefined;
}

export function useFieldControlProps({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  id,
}: {
  "aria-describedby"?: string | undefined;
  "aria-invalid"?:
    boolean | "false" | "grammar" | "spelling" | "true" | undefined;
  id?: string | undefined;
}): {
  "aria-describedby": string | undefined;
  "aria-invalid":
    boolean | "false" | "grammar" | "spelling" | "true" | undefined;
  id: string | undefined;
} {
  const field = useOptionalFieldContext();
  return {
    "aria-describedby": mergeAriaTokens(
      ariaDescribedBy,
      field?.descriptionId,
      field?.messageId,
    ),
    "aria-invalid": ariaInvalid ?? (field?.invalid || undefined),
    id: id ?? field?.controlId,
  };
}

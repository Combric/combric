"use client";

import {
  useEffect,
  useId,
  useState,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from "react";

import { classNames } from "./class-names.js";
import { FieldContext, useOptionalFieldContext } from "./field-internals.js";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  controlId?: string;
  invalid?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function Field({
  className,
  controlId,
  invalid = false,
  ref,
  ...props
}: FieldProps): ReactElement {
  const reactId = useId().replaceAll(":", "");
  const baseId = `combric-field-${reactId}`;
  const [descriptionId, setDescriptionId] = useState<string>();
  const [messageId, setMessageId] = useState<string>();

  return (
    <FieldContext.Provider
      value={{
        controlId: controlId ?? `${baseId}-control`,
        defaultDescriptionId: `${baseId}-description`,
        defaultMessageId: `${baseId}-message`,
        descriptionId,
        invalid,
        labelId: `${baseId}-label`,
        messageId,
        setDescriptionId,
        setMessageId,
      }}
    >
      <div
        {...props}
        ref={ref}
        className={classNames("combric-field", className)}
        data-invalid={invalid ? "" : undefined}
      />
    </FieldContext.Provider>
  );
}

export interface FieldDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function FieldDescription({
  className,
  id,
  ref,
  ...props
}: FieldDescriptionProps): ReactElement {
  const field = useOptionalFieldContext();
  if (field === null) {
    throw new Error("FieldDescription must be nested inside Field.");
  }
  const descriptionId = id ?? field.defaultDescriptionId;

  useEffect(() => {
    field.setDescriptionId(descriptionId);
    return () => field.setDescriptionId(undefined);
  }, [descriptionId, field.setDescriptionId]);

  return (
    <p
      {...props}
      ref={ref}
      id={descriptionId}
      className={classNames("combric-field__description", className)}
    />
  );
}

export interface FieldMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function FieldMessage({
  className,
  id,
  ref,
  ...props
}: FieldMessageProps): ReactElement {
  const field = useOptionalFieldContext();
  if (field === null) {
    throw new Error("FieldMessage must be nested inside Field.");
  }
  const messageId = id ?? field.defaultMessageId;

  useEffect(() => {
    field.setMessageId(messageId);
    return () => field.setMessageId(undefined);
  }, [field.setMessageId, messageId]);

  return (
    <p
      {...props}
      ref={ref}
      id={messageId}
      className={classNames("combric-field__message", className)}
      data-invalid={field.invalid ? "" : undefined}
    />
  );
}

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  ref?: Ref<HTMLFieldSetElement>;
}

export function Fieldset({
  className,
  ref,
  ...props
}: FieldsetProps): ReactElement {
  return (
    <fieldset
      {...props}
      ref={ref}
      className={classNames("combric-fieldset", className)}
    />
  );
}

export interface FieldLegendProps extends HTMLAttributes<HTMLLegendElement> {
  ref?: Ref<HTMLLegendElement>;
}

export function FieldLegend({
  className,
  ref,
  ...props
}: FieldLegendProps): ReactElement {
  return (
    <legend
      {...props}
      ref={ref}
      className={classNames("combric-fieldset__legend", className)}
    />
  );
}

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function InputGroup({
  className,
  ref,
  ...props
}: InputGroupProps): ReactElement {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("combric-input-group", className)}
    />
  );
}

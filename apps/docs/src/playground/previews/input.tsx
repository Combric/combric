import { Input } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Input
      aria-label="Email"
      placeholder={String(props.placeholder)}
      aria-invalid={props.invalid ? "true" : undefined}
      disabled={Boolean(props.disabled)}
    />
  );
}

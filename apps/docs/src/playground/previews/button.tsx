import { Button } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Button
      variant={props.variant as "primary" | "secondary" | "ghost"}
      size={props.size as "sm" | "md" | "lg"}
      disabled={Boolean(props.disabled)}
    >
      {String(props.text)}
    </Button>
  );
}

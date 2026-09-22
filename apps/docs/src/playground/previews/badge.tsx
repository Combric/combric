import { Badge } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Badge variant={props.variant as "neutral" | "accent"}>
      {String(props.text)}
    </Badge>
  );
}

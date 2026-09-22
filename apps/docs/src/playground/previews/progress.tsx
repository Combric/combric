import { Progress } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Progress
      aria-label="Import progress"
      value={Number(props.value)}
      max={100}
    />
  );
}

import { Label, Switch } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Label>
      <Switch
        checked={Boolean(props.checked)}
        onChange={() => undefined}
        disabled={Boolean(props.disabled)}
      />{" "}
      {String(props.text)}
    </Label>
  );
}

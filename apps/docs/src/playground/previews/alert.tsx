import { Alert, AlertDescription, AlertTitle } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Alert tone={props.tone as "neutral" | "error"}>
      <AlertTitle>{String(props.title)}</AlertTitle>
      <AlertDescription>{String(props.description)}</AlertDescription>
    </Alert>
  );
}

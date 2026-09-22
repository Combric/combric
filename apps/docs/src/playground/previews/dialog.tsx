import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  return (
    <Dialog open={Boolean(props.open)} onOpenChange={() => undefined}>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Confirm</DialogTitle>
        <DialogDescription>Review the operation.</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

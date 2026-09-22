import { Tabs, TabsContent, TabsList, TabsTrigger } from "@combric/react";
import type { PlaygroundProps } from "../registry";
export default function Preview({
  props,
}: {
  readonly props: PlaygroundProps;
}) {
  const value = String(props.value);
  return (
    <Tabs value={value} onValueChange={() => undefined}>
      <TabsList aria-label="Project sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
    </Tabs>
  );
}

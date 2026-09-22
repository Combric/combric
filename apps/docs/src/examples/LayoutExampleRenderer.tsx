import { layoutExamples } from "./layout-examples";

export function LayoutExampleRenderer({ slug }: { readonly slug: string }) {
  const example = layoutExamples[slug];
  if (!example) return <p role="alert">Example unavailable.</p>;
  const Example = example.Component;
  return <Example />;
}

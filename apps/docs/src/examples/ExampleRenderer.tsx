import { examples } from "./catalogue-examples";

export function ExampleRenderer({ slug }: { readonly slug: string }) {
  const example = examples[slug];
  if (!example) return <p role="alert">Example unavailable.</p>;
  const Example = example.Component;
  return <Example />;
}

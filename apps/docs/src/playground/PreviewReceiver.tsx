import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ComponentType, ErrorInfo, ReactNode } from "react";
import { getPlaygroundEntry, validateProps } from "./registry";
import type { PlaygroundProps } from "./registry";

const modules = import.meta.glob<{
  default: ComponentType<{ readonly props: PlaygroundProps }>;
}>("./previews/*.tsx");

interface PreviewState {
  readonly family: string;
  readonly props: PlaygroundProps;
}
const initial: PreviewState = {
  family: "button",
  props: getPlaygroundEntry("button").defaults,
};

class PreviewErrorBoundary extends Component<
  { readonly resetKey: string; readonly children: ReactNode },
  { readonly error: boolean }
> {
  override state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Playground preview failed", error, info);
  }
  override componentDidUpdate(previous: { readonly resetKey: string }) {
    if (previous.resetKey !== this.props.resetKey && this.state.error)
      this.setState({ error: false });
  }
  override render() {
    return this.state.error ? (
      <div role="alert">
        <p>Preview failed.</p>
        <p>Use Reset in the Playground controls.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

function loadPreview(family: string) {
  const path = `./previews/${family}.tsx`;
  const loader = modules[path];
  if (!loader) throw new Error(`No preview module for ${family}`);
  return lazy(loader);
}

export function PreviewReceiver() {
  const [state, setState] = useState<PreviewState>(initial);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent
      )
        return;
      const data = event.data as {
        type?: unknown;
        family?: unknown;
        props?: unknown;
      };
      if (
        data.type !== "combric-playground-state" ||
        typeof data.family !== "string"
      )
        return;
      try {
        const entry = getPlaygroundEntry(data.family);
        setState({ family: entry.id, props: validateProps(entry, data.props) });
      } catch {
        // Invalid messages are ignored rather than executed or rendered.
      }
    };
    window.addEventListener("message", receive);
    window.parent.postMessage(
      { type: "combric-playground-ready" },
      window.location.origin,
    );
    return () => window.removeEventListener("message", receive);
  }, []);
  const Preview = loadPreview(state.family);
  return (
    <PreviewErrorBoundary
      resetKey={`${state.family}:${JSON.stringify(state.props)}`}
    >
      <Suspense fallback={<p>Loading preview…</p>}>
        <Preview props={state.props} />
      </Suspense>
    </PreviewErrorBoundary>
  );
}

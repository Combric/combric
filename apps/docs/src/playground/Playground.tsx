import { useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "../components/CopyButton";
import {
  getPlaygroundEntry,
  playgroundEntries,
  validateProps,
} from "./registry";
import type { PlaygroundProps } from "./registry";

type Viewport = "desktop" | "tablet" | "mobile";
const widths: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "48rem",
  mobile: "24rem",
};

export function Playground() {
  const [family, setFamily] = useState("button");
  const [props, setProps] = useState<PlaygroundProps>(
    getPlaygroundEntry("button").defaults,
  );
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const entry = getPlaygroundEntry(family);
  const source = useMemo(
    () =>
      `import { ${entry.label.replace(" / Sheet", "").replaceAll(" ", "")} } from "@combric/react";\n\nexport function Example() {\n  return (${entry.code(props)});\n}`,
    [entry, props],
  );

  function send() {
    frame.current?.contentWindow?.postMessage(
      { type: "combric-playground-state", family, props },
      window.location.origin,
    );
  }

  useEffect(send, [family, props, frameKey]);
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        (event.data as { type?: unknown }).type === "combric-playground-ready"
      )
        send();
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  });

  function selectFamily(next: string) {
    const nextEntry = getPlaygroundEntry(next);
    setFamily(next);
    setProps(nextEntry.defaults);
  }

  function update(name: string, value: unknown) {
    setProps((current) => validateProps(entry, { ...current, [name]: value }));
  }

  function reset() {
    setProps(entry.defaults);
    setViewport("desktop");
    setFrameKey((value) => value + 1);
  }

  return (
    <div className="combric-playground">
      <section
        className="combric-playground__controls"
        aria-label="Playground controls"
      >
        <label>
          Component family
          <select
            value={family}
            onChange={(event) => selectFamily(event.target.value)}
          >
            {playgroundEntries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {entry.controls.map((control) => {
          if (control.kind === "boolean")
            return (
              <label key={control.name}>
                <input
                  type="checkbox"
                  checked={Boolean(props[control.name])}
                  onChange={(event) =>
                    update(control.name, event.target.checked)
                  }
                />{" "}
                {control.label}
              </label>
            );
          if (control.kind === "enum")
            return (
              <label key={control.name}>
                {control.label}
                <select
                  value={String(props[control.name])}
                  onChange={(event) => update(control.name, event.target.value)}
                >
                  {control.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            );
          if (control.kind === "number")
            return (
              <label key={control.name}>
                {control.label}
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={Number(props[control.name])}
                  onChange={(event) =>
                    update(control.name, event.target.valueAsNumber)
                  }
                />
                <output>{Number(props[control.name])}</output>
              </label>
            );
          return (
            <label key={control.name}>
              {control.label}
              <input
                type="text"
                maxLength={control.maxLength}
                value={String(props[control.name])}
                onChange={(event) => update(control.name, event.target.value)}
              />
            </label>
          );
        })}
        <fieldset>
          <legend>Preview viewport</legend>
          {(["desktop", "tablet", "mobile"] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="viewport"
                value={value}
                checked={viewport === value}
                onChange={() => setViewport(value)}
              />{" "}
              {value}
            </label>
          ))}
        </fieldset>
        <button type="button" onClick={reset}>
          Reset Playground
        </button>
      </section>
      <section
        aria-label="Component preview"
        className="combric-playground__stage"
      >
        <iframe
          key={frameKey}
          ref={frame}
          title={`${entry.label} preview`}
          src="/playground/preview/"
          onLoad={send}
          style={{ width: widths[viewport] }}
        />
      </section>
      <section aria-labelledby="playground-code">
        <h2 id="playground-code">Generated TSX</h2>
        <CopyButton text={source} />
        <pre tabIndex={0}>
          <code>{source}</code>
        </pre>
      </section>
    </div>
  );
}

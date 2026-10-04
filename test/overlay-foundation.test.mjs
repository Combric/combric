import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";

function rectangle({ bottom, height, left, right, top, width }) {
  return {
    bottom,
    height,
    left,
    right,
    top,
    width,
    x: left,
    y: top,
    toJSON() {},
  };
}

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://consumer.example/",
  });
  const previous = {
    document: globalThis.document,
    Element: globalThis.Element,
    getComputedStyle: globalThis.getComputedStyle,
    HTMLElement: globalThis.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    Node: globalThis.Node,
    ResizeObserver: globalThis.ResizeObserver,
    window: globalThis.window,
  };
  class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  Object.assign(globalThis, {
    document: dom.window.document,
    Element: dom.window.Element,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    Node: dom.window.Node,
    ResizeObserver,
    window: dom.window,
  });
  const viewport = rectangle({
    bottom: 768,
    height: 768,
    left: 0,
    right: 1024,
    top: 0,
    width: 1024,
  });
  for (const element of [
    dom.window.document.documentElement,
    dom.window.document.body,
  ]) {
    Object.defineProperties(element, {
      clientHeight: { configurable: true, value: 768 },
      clientWidth: { configurable: true, value: 1024 },
    });
    element.getBoundingClientRect = () => viewport;
  }
  dom.window.ResizeObserver = ResizeObserver;
  const root = createRoot(dom.window.document.querySelector("#root"));

  try {
    await run({ root, window: dom.window });
  } finally {
    await act(async () => root.unmount());
    Object.assign(globalThis, previous);
    dom.window.close();
  }
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function VirtualAnchorProbe({ anchor, useOverlayPositioning }) {
  const positioning = useOverlayPositioning({
    align: "start",
    collisionPadding: 8,
    offset: 8,
    open: true,
    side: "bottom",
  });

  useEffect(() => {
    positioning.refs.setPositionReference(anchor);
  }, [anchor, positioning.refs]);

  return createElement("div", {
    "data-placement": positioning.placement,
    "data-positioned": String(positioning.isPositioned),
    ref: positioning.refs.setFloating,
    style: positioning.floatingStyles,
  });
}

test("overlay entry remains SSR-safe", () => {
  const probe = `
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { useOverlayPositioning } from "@combric/react/overlay";
    function ServerProbe() {
      const positioning = useOverlayPositioning({ open: false });
      return createElement("div", { style: positioning.floatingStyles });
    }
    const markup = renderToStaticMarkup(createElement(ServerProbe));
    if (!markup.includes("position:fixed")) process.exit(1);
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", probe],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("overlay positioning accepts a virtual anchor", async () => {
  await withDom(async ({ root, window }) => {
    const { createOverlayPlacement, useOverlayPositioning } =
      await import("@combric/react/overlay");
    assert.equal(createOverlayPlacement("bottom", "start"), "bottom-start");
    assert.equal(createOverlayPlacement("left", "center"), "left");

    let measurements = 0;
    const anchor = {
      contextElement: window.document.body,
      getBoundingClientRect: () => {
        measurements += 1;
        return rectangle({
          bottom: 40,
          height: 20,
          left: 32,
          right: 72,
          top: 20,
          width: 40,
        });
      },
    };
    await act(async () => {
      root.render(
        createElement(VirtualAnchorProbe, { anchor, useOverlayPositioning }),
      );
    });
    await settle();

    const floating = window.document.querySelector("[data-placement]");
    assert.equal(floating.dataset.placement, "bottom-start");
    assert.equal(floating.style.position, "fixed");
    assert.equal(floating.style.left, "32px");
    assert.equal(floating.style.top, "48px");
    assert.ok(measurements > 0);
    assert.equal(floating.dataset.positioned, "true");
  });
});

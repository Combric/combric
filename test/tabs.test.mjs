import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@combric/react";

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://consumer.example/",
  });
  const previous = {
    document: globalThis.document,
    Event: globalThis.Event,
    HTMLElement: globalThis.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    window: globalThis.window,
  };
  Object.assign(globalThis, {
    document: dom.window.document,
    Event: dom.window.Event,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    window: dom.window,
  });

  const container = dom.window.document.querySelector("#root");
  const root = createRoot(container);
  try {
    await run({ container, root, window: dom.window });
  } finally {
    await act(async () => root.unmount());
    Object.assign(globalThis, previous);
    dom.window.close();
  }
}

function tabsTree(props = {}) {
  return createElement(
    Tabs,
    props,
    createElement(
      TabsList,
      { "aria-label": "Sections" },
      createElement(TabsTrigger, { value: "overview" }, "Overview"),
      createElement(
        TabsTrigger,
        { disabled: true, value: "disabled" },
        "Disabled",
      ),
      createElement(TabsTrigger, { value: "activity" }, "Activity"),
    ),
    createElement(TabsContent, { value: "overview" }, "Overview panel"),
    createElement(TabsContent, { value: "disabled" }, "Disabled panel"),
    createElement(TabsContent, { value: "activity" }, "Activity panel"),
  );
}

test("Tabs exposes stable ARIA relationships and uncontrolled activation", async () => {
  await withDom(async ({ container, root }) => {
    const changes = [];
    const tabsRef = createRef();
    await act(async () => {
      root.render(
        tabsTree({
          className: "consumer-tabs",
          defaultValue: "overview",
          onValueChange: (value) => changes.push(value),
          ref: tabsRef,
        }),
      );
    });

    const rootElement = container.querySelector(".combric-tabs");
    const list = container.querySelector('[role="tablist"]');
    const tabs = container.querySelectorAll('[role="tab"]');
    const panels = container.querySelectorAll('[role="tabpanel"]');
    assert.equal(rootElement, tabsRef.current);
    assert.equal(rootElement.className, "combric-tabs consumer-tabs");
    assert.equal(list.getAttribute("aria-orientation"), "horizontal");
    assert.equal(tabs[0].getAttribute("aria-selected"), "true");
    assert.equal(tabs[0].tabIndex, 0);
    assert.equal(tabs[1].disabled, true);
    assert.equal(tabs[2].tabIndex, -1);
    assert.equal(tabs[0].getAttribute("aria-controls"), panels[0].id);
    assert.equal(panels[0].getAttribute("aria-labelledby"), tabs[0].id);
    assert.equal(panels[0].hidden, false);
    assert.equal(panels[2].hidden, true);
    const stableTabId = tabs[0].id;

    await act(async () => tabs[2].click());
    assert.equal(tabs[2].getAttribute("aria-selected"), "true");
    assert.equal(panels[2].hidden, false);
    assert.deepEqual(changes, ["activity"]);
    assert.equal(tabs[0].id, stableTabId);
  });
});

test("Tabs arrow, Home, and End keys skip disabled tabs with automatic activation", async () => {
  await withDom(async ({ container, root, window }) => {
    await act(async () => root.render(tabsTree({ defaultValue: "overview" })));
    const tabs = container.querySelectorAll('[role="tab"]');

    tabs[0].focus();
    await act(async () => {
      tabs[0].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
        }),
      );
    });
    assert.equal(window.document.activeElement, tabs[2]);
    assert.equal(tabs[2].getAttribute("aria-selected"), "true");

    await act(async () => {
      tabs[2].dispatchEvent(
        new window.KeyboardEvent("keydown", { bubbles: true, key: "Home" }),
      );
    });
    assert.equal(window.document.activeElement, tabs[0]);
    assert.equal(tabs[0].getAttribute("aria-selected"), "true");

    await act(async () => {
      tabs[0].dispatchEvent(
        new window.KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      );
    });
    assert.equal(window.document.activeElement, tabs[2]);
  });
});

test("controlled Tabs reports changes while controlled value remains authoritative", async () => {
  await withDom(async ({ container, root }) => {
    const changes = [];
    const onValueChange = (value) => changes.push(value);
    await act(async () => {
      root.render(tabsTree({ onValueChange, value: "overview" }));
    });
    const tabs = container.querySelectorAll('[role="tab"]');
    await act(async () => tabs[2].click());
    assert.deepEqual(changes, ["activity"]);
    assert.equal(tabs[0].getAttribute("aria-selected"), "true");
    assert.equal(tabs[2].getAttribute("aria-selected"), "false");

    await act(async () => {
      root.render(tabsTree({ onValueChange, value: "activity" }));
    });
    assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  });
});

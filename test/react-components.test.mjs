import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Cluster,
  Container,
  Grid,
  Inline,
  Stack,
} from "@combric/react";

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
    await run({ container, root });
  } finally {
    await act(async () => root.unmount());
    Object.assign(globalThis, previous);
    dom.window.close();
  }
}

function accordionTree(props = {}, itemProps = {}) {
  return createElement(
    Accordion,
    props,
    createElement(
      AccordionItem,
      { value: "details", ...itemProps },
      createElement(AccordionTrigger, null, "Details"),
      createElement(AccordionContent, null, "Body"),
    ),
  );
}

test("Button preserves native semantics, variants, classes, disabled behavior, and ref", async () => {
  await withDom(async ({ container, root }) => {
    const ref = createRef();
    let clicks = 0;
    await act(async () => {
      root.render(
        createElement(
          Button,
          {
            className: "consumer-button",
            disabled: true,
            onClick: () => {
              clicks += 1;
            },
            ref,
            size: "lg",
            variant: "ghost",
          },
          "Save",
        ),
      );
    });

    const button = container.querySelector("button");
    assert.equal(button.type, "button");
    assert.equal(button.disabled, true);
    assert.equal(button.dataset.variant, "ghost");
    assert.equal(button.dataset.size, "lg");
    assert.equal(button.className, "combric-button consumer-button");
    assert.equal(ref.current, button);
    button.click();
    assert.equal(clicks, 0);
  });
});

test("Card composes semantic elements and extends consumer classes", async () => {
  await withDom(async ({ container, root }) => {
    await act(async () => {
      root.render(
        createElement(
          Card,
          { className: "consumer-card" },
          createElement(
            CardHeader,
            null,
            createElement(CardTitle, null, "Title"),
            createElement(CardDescription, null, "Description"),
          ),
          createElement(CardContent, null, "Content"),
          createElement(CardFooter, null, "Footer"),
        ),
      );
    });

    assert.equal(container.firstElementChild.tagName, "SECTION");
    assert.equal(container.querySelector("h2").textContent, "Title");
    assert.equal(container.querySelector("p").textContent, "Description");
    assert.equal(container.querySelector("footer").textContent, "Footer");
    assert.equal(
      container.firstElementChild.className,
      "combric-card consumer-card",
    );
  });
});

test("uncontrolled Accordion exposes stable ARIA relationships and toggles one item", async () => {
  await withDom(async ({ container, root }) => {
    const transitions = [];
    await act(async () => {
      root.render(
        accordionTree({
          defaultValue: "details",
          onValueChange: (value) => transitions.push(value),
        }),
      );
    });

    const trigger = container.querySelector("button");
    const content = container.querySelector('[role="region"]');
    const triggerId = trigger.id;
    const contentId = content.id;
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(trigger.getAttribute("aria-controls"), contentId);
    assert.equal(content.getAttribute("aria-labelledby"), triggerId);
    assert.equal(content.hidden, false);

    await act(async () => trigger.click());
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(content.hidden, true);
    assert.deepEqual(transitions, [null]);
    assert.equal(trigger.id, triggerId);
    assert.equal(content.id, contentId);
  });
});

test("controlled Accordion remains authoritative and disabled items do not transition", async () => {
  await withDom(async ({ container, root }) => {
    const transitions = [];
    const onValueChange = (value) => transitions.push(value);
    await act(async () => {
      root.render(accordionTree({ onValueChange, value: null }));
    });

    const trigger = container.querySelector("button");
    await act(async () => trigger.click());
    assert.deepEqual(transitions, ["details"]);
    assert.equal(trigger.getAttribute("aria-expanded"), "false");

    const stableId = trigger.id;
    await act(async () => {
      root.render(accordionTree({ onValueChange, value: "details" }));
    });
    assert.equal(trigger.id, stableId);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");

    await act(async () => {
      root.render(
        accordionTree({ onValueChange, value: null }, { disabled: true }),
      );
    });
    assert.equal(trigger.disabled, true);
    trigger.click();
    assert.deepEqual(transitions, ["details"]);
  });
});

test("layout primitives forward native props, refs, classes, and bounded options", async () => {
  await withDom(async ({ container, root }) => {
    const containerRef = createRef();
    const gridRef = createRef();
    await act(async () => {
      root.render(
        createElement(
          Container,
          {
            className: "consumer-container",
            id: "page",
            ref: containerRef,
            size: "prose",
          },
          createElement(
            Stack,
            { className: "consumer-stack", gap: "6" },
            createElement(
              Inline,
              { align: "baseline", className: "consumer-inline", gap: "3" },
              "Inline",
            ),
            createElement(
              Cluster,
              { align: "end", className: "consumer-cluster", gap: "2" },
              "Cluster",
            ),
            createElement(
              Grid,
              {
                className: "consumer-grid",
                columns: 3,
                gap: "8",
                id: "explicit-grid",
                ref: gridRef,
              },
              "Explicit",
            ),
            createElement(Grid, { minItemWidth: "lg" }, "Intrinsic"),
          ),
        ),
      );
    });

    const page = container.querySelector("#page");
    assert.equal(page, containerRef.current);
    assert.equal(page.className, "combric-container consumer-container");
    assert.equal(page.dataset.size, "prose");
    assert.equal(
      page.querySelector(".combric-stack").className,
      "combric-stack consumer-stack",
    );
    assert.equal(page.querySelector(".combric-stack").dataset.gap, "6");
    assert.equal(
      page.querySelector(".combric-inline").className,
      "combric-inline consumer-inline",
    );
    assert.equal(
      page.querySelector(".combric-inline").dataset.align,
      "baseline",
    );
    assert.equal(
      page.querySelector(".combric-cluster").className,
      "combric-cluster consumer-cluster",
    );
    assert.equal(page.querySelector(".combric-cluster").dataset.align, "end");
    const grids = page.querySelectorAll(".combric-grid");
    assert.equal(grids[0], gridRef.current);
    assert.equal(grids[0].id, "explicit-grid");
    assert.equal(grids[0].className, "combric-grid consumer-grid");
    assert.equal(grids[0].dataset.columns, "3");
    assert.equal(grids[0].dataset.gap, "8");
    assert.equal(grids[0].dataset.minItemWidth, undefined);
    assert.equal(grids[1].dataset.minItemWidth, "lg");
    assert.equal(page.querySelector("[aria-label]"), null);
  });
});

test("layout primitives reject unsupported runtime options deterministically", () => {
  assert.throws(
    () => renderToStaticMarkup(createElement(Stack, { gap: "5" }, "Invalid")),
    /Stack gap must be one of/,
  );
  assert.throws(
    () => renderToStaticMarkup(createElement(Grid, { columns: 5 }, "Invalid")),
    /Grid columns must be one of/,
  );
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(Grid, { columns: 2, minItemWidth: "sm" }, "Invalid"),
      ),
    /cannot be used together/,
  );
});

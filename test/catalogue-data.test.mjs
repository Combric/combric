import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@combric/react";

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://consumer.example/",
  });
  const previous = {
    document: globalThis.document,
    Element: globalThis.Element,
    Event: globalThis.Event,
    HTMLElement: globalThis.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    MouseEvent: globalThis.MouseEvent,
    Node: globalThis.Node,
    window: globalThis.window,
  };
  Object.assign(globalThis, {
    document: dom.window.document,
    Element: dom.window.Element,
    Event: dom.window.Event,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    MouseEvent: dom.window.MouseEvent,
    Node: dom.window.Node,
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

test("Collapsible supports uncontrolled disclosure relationships and handlers", async () => {
  await withDom(async ({ container, root }) => {
    const contentRef = createRef();
    const changes = [];
    await act(async () => {
      root.render(
        createElement(
          Collapsible,
          { onOpenChange: (open) => changes.push(open) },
          createElement(CollapsibleTrigger, null, "Details"),
          createElement(
            CollapsibleContent,
            { ref: contentRef },
            "Disclosure content",
          ),
        ),
      );
    });
    const trigger = container.querySelector("button");
    const content = container.querySelector('[role="region"]');
    assert.equal(contentRef.current, content);
    assert.equal(trigger.type, "button");
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(trigger.getAttribute("aria-controls"), content.id);
    assert.equal(content.getAttribute("aria-labelledby"), trigger.id);
    assert.equal(content.hidden, true);
    await act(async () => trigger.click());
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(content.hidden, false);
    assert.deepEqual(changes, [true]);
  });
});

test("controlled and disabled Collapsible remain authoritative", async () => {
  await withDom(async ({ container, root }) => {
    const changes = [];
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(
            Collapsible,
            { onOpenChange: (open) => changes.push(open), open: true },
            createElement(CollapsibleTrigger, null, "Controlled"),
            createElement(CollapsibleContent, null, "Content"),
          ),
          createElement(
            Collapsible,
            { disabled: true },
            createElement(CollapsibleTrigger, null, "Disabled"),
            createElement(CollapsibleContent, null, "Hidden"),
          ),
        ),
      );
    });
    const [controlled, disabled] = container.querySelectorAll("button");
    await act(async () => controlled.click());
    assert.deepEqual(changes, [false]);
    assert.equal(controlled.getAttribute("aria-expanded"), "true");
    assert.equal(disabled.disabled, true);
    await act(async () => disabled.click());
    assert.deepEqual(changes, [false]);
  });
});

test("Table family renders native semantic structure inside an overflow container", () => {
  const markup = renderToStaticMarkup(
    createElement(
      TableContainer,
      { "aria-label": "Account balances" },
      createElement(
        Table,
        null,
        createElement(TableCaption, null, "Balances by account"),
        createElement(
          TableHeader,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableHead, null, "Account"),
            createElement(TableHead, null, "Balance"),
          ),
        ),
        createElement(
          TableBody,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableCell, null, "Operating"),
            createElement(TableCell, null, "$120"),
          ),
        ),
        createElement(
          TableFooter,
          null,
          createElement(
            TableRow,
            null,
            createElement(TableHead, { scope: "row" }, "Total"),
            createElement(TableCell, null, "$120"),
          ),
        ),
      ),
    ),
  );
  assert.match(markup, /<div[^>]*tabindex="0"/);
  assert.match(markup, /<table/);
  assert.match(markup, /<caption/);
  assert.match(markup, /<thead/);
  assert.match(markup, /<tbody/);
  assert.match(markup, /<tfoot/);
  assert.match(markup, /<th[^>]*scope="col"/);
  assert.match(markup, /<th[^>]*scope="row"/);
  assert.doesNotMatch(markup, /role="grid"/);
});

test("DescriptionList family preserves dl, dt, and dd semantics", () => {
  const markup = renderToStaticMarkup(
    createElement(
      DescriptionList,
      null,
      createElement(DescriptionTerm, null, "Status"),
      createElement(DescriptionDetails, null, "Ready"),
    ),
  );
  assert.match(markup, /<dl/);
  assert.match(markup, /<dt[^>]*>Status<\/dt>/);
  assert.match(markup, /<dd[^>]*>Ready<\/dd>/);
});

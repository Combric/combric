import assert from "node:assert/strict";
import test from "node:test";

import { ActivityIcon } from "@combric/icons";
import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  Button,
  CardTitle,
  DropdownMenu,
  DropdownMenuItem,
  EmptyStateMedia,
  Label,
  PaginationNext,
  PaginationPrevious,
} from "@combric/react";

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://consumer.example/",
  });
  const previous = {
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    window: globalThis.window,
  };

  Object.assign(globalThis, {
    document: dom.window.document,
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

test("icon slots render React icons without changing button semantics or refs", async () => {
  await withDom(async ({ container, root }) => {
    const ref = createRef();
    await act(async () => {
      root.render(
        createElement(
          Button,
          {
            "aria-label": "Save project",
            "data-test-id": "save",
            leadingIcon: createElement(ActivityIcon),
            name: "save",
            ref,
            trailingIcon: createElement("svg", { "data-custom-icon": true }),
          },
          "Save",
        ),
      );
    });

    const button = container.querySelector("button");
    assert.equal(ref.current, button);
    assert.equal(button.getAttribute("aria-label"), "Save project");
    assert.equal(button.getAttribute("data-test-id"), "save");
    assert.equal(button.getAttribute("name"), "save");
    assert.equal(button.textContent, "Save");
    assert.equal(button.querySelectorAll(".combric-icon-slot").length, 2);
    assert.equal(
      button
        .querySelector(".combric-icon-slot--leading")
        .getAttribute("aria-hidden"),
      "true",
    );
    assert.ok(button.querySelector("[data-combric-icon]"));
    assert.ok(button.querySelector("[data-custom-icon]"));
  });
});

test("icon slots preserve labelled navigation and content semantics", async () => {
  await withDom(async ({ container, root }) => {
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(Label, { htmlFor: "project" }, "Project"),
          createElement("input", { id: "project" }),
          createElement(
            CardTitle,
            { id: "heading", icon: createElement(ActivityIcon) },
            "Projects",
          ),
          createElement(EmptyStateMedia, { icon: createElement(ActivityIcon) }),
          createElement(PaginationPrevious, {
            href: "?page=1",
            icon: createElement(ActivityIcon),
          }),
          createElement(PaginationNext, {
            "aria-label": "Next project page",
            href: "?page=3",
            icon: createElement(ActivityIcon),
          }),
        ),
      );
    });

    const label = container.querySelector("label");
    const title = container.querySelector("h2");
    const previous = container.querySelector('a[aria-label="Previous page"]');
    const next = container.querySelector('a[aria-label="Next project page"]');
    assert.equal(label.htmlFor, "project");
    assert.equal(label.textContent, "Project");
    assert.equal(title.id, "heading");
    assert.equal(title.textContent, "Projects");
    assert.equal(title.querySelector('[aria-hidden="true"]') !== null, true);
    assert.equal(previous.textContent, "Previous");
    assert.equal(next.textContent, "Next");
    assert.equal(previous.querySelector('[aria-hidden="true"]') !== null, true);
    assert.equal(next.querySelector('[aria-hidden="true"]') !== null, true);
  });
});

test("icon slots cover accordion triggers and menu items", () => {
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(
        Accordion,
        null,
        createElement(
          AccordionItem,
          { value: "details" },
          createElement(
            AccordionTrigger,
            {
              leadingIcon: createElement(ActivityIcon),
              trailingIcon: createElement(ActivityIcon),
            },
            "Details",
          ),
        ),
      ),
      createElement(
        DropdownMenu,
        null,
        createElement(
          DropdownMenuItem,
          { leadingIcon: createElement(ActivityIcon) },
          "Edit",
        ),
      ),
    ),
  );

  assert.match(markup, /class="combric-accordion__trigger"/);
  assert.match(markup, /class="combric-icon-slot__content">Details<\/span>/);
  assert.match(markup, /class="combric-dropdown-menu__item"/);
  assert.equal((markup.match(/class="combric-icon-slot /g) ?? []).length, 3);
  assert.equal((markup.match(/aria-hidden="true"/g) ?? []).length, 6);
});

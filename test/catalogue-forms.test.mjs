import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldMessage,
  Fieldset,
  Input,
  InputGroup,
  Label,
  Slider,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
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
    KeyboardEvent: globalThis.KeyboardEvent,
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
    KeyboardEvent: dom.window.KeyboardEvent,
    MouseEvent: dom.window.MouseEvent,
    Node: dom.window.Node,
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

async function settle() {
  await act(async () => Promise.resolve());
}

test("Field composes mounted relationships without dangling IDs", async () => {
  await withDom(async ({ container, root }) => {
    function Example() {
      const [showMessage, setShowMessage] = useState(true);
      return createElement(
        Field,
        { invalid: true },
        createElement(Label, null, "Email"),
        createElement(Input, {
          "aria-describedby": "external-help",
          name: "email",
        }),
        createElement(
          FieldDescription,
          { id: "email-help" },
          "Used for receipts.",
        ),
        showMessage
          ? createElement(
              FieldMessage,
              { id: "email-error" },
              "Enter a valid email.",
            )
          : null,
        createElement(
          "button",
          { onClick: () => setShowMessage(false) },
          "Hide message",
        ),
      );
    }

    await act(async () => root.render(createElement(Example)));
    await settle();
    const input = container.querySelector("input");
    const label = container.querySelector("label");
    const description = container.querySelector(".combric-field__description");
    const message = container.querySelector(".combric-field__message");
    assert.equal(label.htmlFor, input.id);
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.deepEqual(
      new Set(input.getAttribute("aria-describedby").split(" ")),
      new Set(["external-help", description.id, message.id]),
    );
    assert.equal(message.hasAttribute("role"), false);

    await act(async () => container.querySelector("button").click());
    await settle();
    assert.equal(container.querySelector(".combric-field__message"), null);
    assert.deepEqual(
      new Set(input.getAttribute("aria-describedby").split(" ")),
      new Set(["external-help", description.id]),
    );
  });
});

test("Fieldset, InputGroup, and Slider retain native form semantics", async () => {
  await withDom(async ({ container, root, window }) => {
    const sliderRef = createRef();
    await act(async () => {
      root.render(
        createElement(
          "form",
          null,
          createElement(
            Fieldset,
            { disabled: true },
            createElement(FieldLegend, null, "Preferences"),
            createElement(
              InputGroup,
              null,
              createElement("span", { "aria-hidden": "true" }, "$"),
              createElement(Input, { name: "amount" }),
              createElement("button", { type: "button" }, "Clear"),
            ),
          ),
          createElement(Label, { htmlFor: "volume" }, "Volume"),
          createElement(Slider, {
            defaultValue: "25",
            id: "volume",
            max: "100",
            min: "0",
            name: "volume",
            ref: sliderRef,
            step: "5",
          }),
        ),
      );
    });

    const fieldset = container.querySelector("fieldset");
    const slider = container.querySelector('input[type="range"]');
    assert.equal(fieldset.disabled, true);
    assert.equal(fieldset.querySelector("legend").textContent, "Preferences");
    assert.ok(fieldset.querySelector(".combric-input-group input"));
    assert.equal(sliderRef.current, slider);
    assert.equal(slider.value, "25");
    assert.equal(slider.getAttribute("role"), null);
    assert.equal(
      new window.FormData(container.querySelector("form")).get("volume"),
      "25",
    );
  });
});

test("Toggle supports native button events and controlled or uncontrolled state", async () => {
  await withDom(async ({ container, root }) => {
    const changes = [];
    const ref = createRef();
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(
            Toggle,
            {
              defaultPressed: true,
              onPressedChange: (pressed) => changes.push(pressed),
              ref,
            },
            "Bold",
          ),
          createElement(
            Toggle,
            {
              onClick: (event) => event.preventDefault(),
              onPressedChange: (pressed) => changes.push(pressed),
              pressed: false,
            },
            "Locked",
          ),
        ),
      );
    });
    const [uncontrolled, controlled] = container.querySelectorAll("button");
    assert.equal(ref.current, uncontrolled);
    assert.equal(uncontrolled.type, "button");
    assert.equal(uncontrolled.getAttribute("aria-pressed"), "true");
    await act(async () => uncontrolled.click());
    assert.equal(uncontrolled.getAttribute("aria-pressed"), "false");
    assert.deepEqual(changes, [false]);
    await act(async () => controlled.click());
    assert.equal(controlled.getAttribute("aria-pressed"), "false");
    assert.deepEqual(changes, [false]);
  });
});

test("ToggleGroup separates roving focus from selection", async () => {
  await withDom(async ({ container, root, window }) => {
    const changes = [];
    await act(async () => {
      root.render(
        createElement(
          ToggleGroup,
          {
            "aria-label": "Alignment",
            defaultValue: "left",
            onValueChange: (value) => changes.push(value),
            type: "single",
          },
          createElement(ToggleGroupItem, { value: "left" }, "Left"),
          createElement(
            ToggleGroupItem,
            { disabled: true, value: "center" },
            "Center",
          ),
          createElement(ToggleGroupItem, { value: "right" }, "Right"),
        ),
      );
    });
    await settle();
    const items = container.querySelectorAll("button");
    assert.deepEqual(
      [...items].map((item) => item.tabIndex),
      [0, -1, -1],
    );
    items[0].focus();
    await act(async () => {
      items[0].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "ArrowRight",
        }),
      );
    });
    assert.equal(window.document.activeElement, items[2]);
    assert.equal(items[0].getAttribute("aria-pressed"), "true");
    assert.equal(items[2].getAttribute("aria-pressed"), "false");
    assert.deepEqual(changes, []);
    await act(async () => items[2].click());
    assert.equal(items[0].getAttribute("aria-pressed"), "false");
    assert.equal(items[2].getAttribute("aria-pressed"), "true");
    assert.deepEqual(changes, ["right"]);
    await act(async () => {
      items[2].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Home",
        }),
      );
    });
    assert.equal(window.document.activeElement, items[0]);
  });
});

test("vertical multiple ToggleGroup navigates and preserves independent selections", async () => {
  await withDom(async ({ container, root, window }) => {
    const changes = [];
    await act(async () => {
      root.render(
        createElement(
          ToggleGroup,
          {
            defaultValue: ["bold"],
            onValueChange: (value) => changes.push(value),
            orientation: "vertical",
            type: "multiple",
          },
          createElement(ToggleGroupItem, { value: "bold" }, "Bold"),
          createElement(ToggleGroupItem, { value: "italic" }, "Italic"),
        ),
      );
    });
    await settle();
    const items = container.querySelectorAll("button");
    items[0].focus();
    await act(async () => {
      items[0].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "ArrowDown",
        }),
      );
    });
    assert.equal(window.document.activeElement, items[1]);
    await act(async () => items[1].click());
    assert.deepEqual(changes, [["bold", "italic"]]);
    assert.equal(items[0].getAttribute("aria-pressed"), "true");
    assert.equal(items[1].getAttribute("aria-pressed"), "true");
  });
});

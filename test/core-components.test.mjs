import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Checkbox,
  Input,
  Label,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Switch,
  Textarea,
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
    await run({ container, root, window: dom.window });
  } finally {
    await act(async () => root.unmount());
    Object.assign(globalThis, previous);
    dom.window.close();
  }
}

test("native form controls preserve labels, props, refs, invalid state, and values", async () => {
  await withDom(async ({ container, root, window }) => {
    const inputRef = createRef();
    await act(async () => {
      root.render(
        createElement(
          "form",
          null,
          createElement(Label, { htmlFor: "email" }, "Email"),
          createElement(Input, {
            "aria-invalid": true,
            className: "consumer-input",
            id: "email",
            name: "email",
            ref: inputRef,
            required: true,
            type: "email",
            value: "person@example.com",
            readOnly: true,
          }),
          createElement(Textarea, {
            disabled: true,
            name: "notes",
            placeholder: "Notes",
          }),
          createElement(
            Select,
            { defaultValue: "eu", name: "region", required: true },
            createElement("option", { value: "eu" }, "Europe"),
            createElement("option", { value: "us" }, "United States"),
          ),
        ),
      );
    });

    const label = container.querySelector("label");
    const input = container.querySelector("input");
    const textarea = container.querySelector("textarea");
    const select = container.querySelector("select");
    assert.equal(label.htmlFor, "email");
    assert.equal(label.control, input);
    assert.equal(inputRef.current, input);
    assert.equal(input.className, "combric-input consumer-input");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.equal(input.required, true);
    assert.equal(input.readOnly, true);
    assert.equal(textarea.disabled, true);
    assert.equal(textarea.placeholder, "Notes");
    assert.equal(select.value, "eu");
    assert.equal(select.required, true);
    assert.equal(select.options.length, 2);
    const data = new window.FormData(container.querySelector("form"));
    assert.equal(data.get("email"), "person@example.com");
    assert.equal(data.get("region"), "eu");
  });
});

test("Checkbox and Switch retain native checkbox and form behavior", async () => {
  await withDom(async ({ container, root, window }) => {
    await act(async () => {
      root.render(
        createElement(
          "form",
          null,
          createElement(
            Label,
            null,
            createElement(Checkbox, { name: "terms" }),
            " Terms",
          ),
          createElement(
            Label,
            null,
            createElement(Switch, {
              "aria-label": "Notifications",
              name: "notifications",
              value: "enabled",
            }),
            " Notifications",
          ),
        ),
      );
    });

    const checkbox = container.querySelector(".combric-checkbox");
    const switchControl = container.querySelector(".combric-switch");
    assert.equal(checkbox.type, "checkbox");
    assert.equal(switchControl.type, "checkbox");
    assert.equal(switchControl.getAttribute("role"), "switch");
    await act(async () => {
      checkbox.click();
      switchControl.click();
    });
    assert.equal(checkbox.checked, true);
    assert.equal(switchControl.checked, true);
    const data = new window.FormData(container.querySelector("form"));
    assert.equal(data.get("terms"), "on");
    assert.equal(data.get("notifications"), "enabled");
  });
});

test("RadioGroup supports uncontrolled, controlled, required, and disabled state", async () => {
  await withDom(async ({ container, root }) => {
    const changes = [];
    function tree(value, disabled = false) {
      const stateProps =
        value === undefined
          ? { defaultValue: "one", key: "uncontrolled" }
          : { key: "controlled", value };
      return createElement(
        RadioGroup,
        {
          ...stateProps,
          "aria-label": "Options",
          disabled,
          name: "option",
          onValueChange: (nextValue) => changes.push(nextValue),
          required: true,
        },
        createElement(Radio, { value: "one" }),
        createElement(Radio, { value: "two" }),
      );
    }

    await act(async () => root.render(tree(undefined)));
    let radios = container.querySelectorAll('input[type="radio"]');
    assert.equal(radios[0].checked, true);
    assert.equal(radios[0].name, "option");
    assert.equal(radios[0].required, true);
    await act(async () => radios[1].click());
    assert.equal(radios[1].checked, true);
    assert.deepEqual(changes, ["two"]);

    await act(async () => root.render(tree("one")));
    radios = container.querySelectorAll('input[type="radio"]');
    await act(async () => radios[1].click());
    assert.equal(radios[0].checked, true);
    assert.deepEqual(changes, ["two", "two"]);

    await act(async () => root.render(tree("one", true)));
    radios = container.querySelectorAll('input[type="radio"]');
    assert.equal(radios[0].disabled, true);
    assert.equal(radios[1].disabled, true);
  });
});

test("Badge, Separator, and Avatar expose restrained semantic contracts", async () => {
  await withDom(async ({ container, root, window }) => {
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(Badge, { variant: "accent" }, "Active"),
          createElement(Separator, null),
          createElement(Separator, { decorative: true }),
          createElement(
            Avatar,
            { size: "lg" },
            createElement(AvatarImage, {
              alt: "Ada Lovelace",
              src: "/ada.png",
            }),
            createElement(AvatarFallback, null, "AL"),
          ),
        ),
      );
    });

    assert.equal(container.querySelector(".combric-badge").tagName, "SPAN");
    assert.equal(
      container.querySelector(".combric-badge").dataset.variant,
      "accent",
    );
    const separators = container.querySelectorAll("hr");
    assert.equal(separators[0].hasAttribute("role"), false);
    assert.equal(separators[1].getAttribute("role"), "none");
    assert.equal(separators[1].getAttribute("aria-hidden"), "true");

    const avatar = container.querySelector(".combric-avatar");
    const image = avatar.querySelector("img");
    const fallback = avatar.querySelector("span");
    assert.equal(avatar.dataset.size, "lg");
    assert.equal(image.alt, "Ada Lovelace");
    assert.equal(fallback.hidden, false);
    await act(async () =>
      image.dispatchEvent(new window.Event("load", { bubbles: true })),
    );
    assert.equal(fallback.hidden, true);
    await act(async () =>
      image.dispatchEvent(new window.Event("error", { bubbles: true })),
    );
    assert.equal(image.hidden, true);
    assert.equal(fallback.hidden, false);
  });
});

test("Breadcrumb provides nav, ordered structure, links, and current page", async () => {
  await withDom(async ({ container, root }) => {
    await act(async () => {
      root.render(
        createElement(
          Breadcrumb,
          null,
          createElement(
            BreadcrumbList,
            null,
            createElement(
              BreadcrumbItem,
              null,
              createElement(BreadcrumbLink, { href: "/" }, "Home"),
            ),
            createElement(BreadcrumbSeparator),
            createElement(
              BreadcrumbItem,
              null,
              createElement(BreadcrumbPage, null, "Current"),
            ),
          ),
        ),
      );
    });

    const nav = container.querySelector("nav");
    assert.equal(nav.getAttribute("aria-label"), "Breadcrumb");
    assert.ok(nav.querySelector("ol"));
    assert.equal(nav.querySelector("a").getAttribute("href"), "/");
    assert.equal(
      nav.querySelector('[aria-current="page"]').textContent,
      "Current",
    );
    assert.equal(
      nav.querySelector('[role="presentation"]').getAttribute("aria-hidden"),
      "true",
    );
  });
});

test("Pagination exposes current and unavailable navigation semantics", async () => {
  await withDom(async ({ container, root }) => {
    await act(async () => {
      root.render(
        createElement(
          Pagination,
          null,
          createElement(
            PaginationList,
            null,
            createElement(
              PaginationItem,
              null,
              createElement(PaginationPrevious, {
                disabled: true,
                href: "?page=0",
              }),
            ),
            createElement(
              PaginationItem,
              null,
              createElement(
                PaginationLink,
                { current: true, href: "?page=1" },
                "1",
              ),
            ),
            createElement(
              PaginationItem,
              null,
              createElement(PaginationNext, { href: "?page=2" }),
            ),
          ),
        ),
      );
    });

    const nav = container.querySelector("nav");
    const links = nav.querySelectorAll("a");
    assert.equal(nav.getAttribute("aria-label"), "Pagination");
    assert.ok(nav.querySelector("ul"));
    assert.equal(links[0].getAttribute("aria-disabled"), "true");
    assert.equal(links[0].hasAttribute("href"), false);
    assert.equal(links[0].tabIndex, -1);
    assert.equal(links[1].getAttribute("aria-current"), "page");
    assert.equal(links[2].getAttribute("aria-label"), "Next page");
  });
});

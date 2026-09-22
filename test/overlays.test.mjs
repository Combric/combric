import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@combric/react";

async function withDom(run) {
  const dom = new JSDOM(
    '<button id="outside">Outside</button><div id="root"></div><div id="portal-target"></div>',
    { url: "https://consumer.example/" },
  );
  const previous = {
    document: globalThis.document,
    Element: globalThis.Element,
    Event: globalThis.Event,
    FocusEvent: globalThis.FocusEvent,
    getComputedStyle: globalThis.getComputedStyle,
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
    FocusEvent: dom.window.FocusEvent,
    getComputedStyle: dom.window.getComputedStyle,
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

test("Dialog portals, isolates background, traps focus, dismisses, and restores focus", async () => {
  await withDom(async ({ container, root, window }) => {
    const triggerRef = createRef();
    const contentRef = createRef();
    await act(async () => {
      root.render(
        createElement(
          Dialog,
          null,
          createElement(DialogTrigger, { ref: triggerRef }, "Open dialog"),
          createElement(
            DialogContent,
            { ref: contentRef },
            createElement(DialogTitle, null, "Account"),
            createElement(DialogDescription, null, "Edit account"),
            createElement(
              "button",
              { autoFocus: true, className: "primary-action" },
              "Primary action",
            ),
            createElement(DialogClose, null, "Close"),
          ),
        ),
      );
    });

    const trigger = container.querySelector("button");
    trigger.focus();
    await act(async () => trigger.click());
    await settle();

    const dialog = window.document.querySelector('[role="dialog"]');
    const primary = dialog.querySelector(".primary-action");
    const close = dialog.querySelector(".combric-dialog__close");
    assert.ok(dialog.closest("[data-combric-portal]"));
    assert.equal(triggerRef.current === trigger, true);
    assert.equal(contentRef.current === dialog, true);
    assert.equal(dialog.getAttribute("aria-modal"), "true");
    assert.equal(
      dialog.getAttribute("aria-labelledby"),
      dialog.querySelector("h2").id,
    );
    assert.equal(
      dialog.getAttribute("aria-describedby"),
      dialog.querySelector("p").id,
    );
    assert.equal(window.document.activeElement === primary, true);
    assert.equal(container.inert, true);
    assert.equal(container.getAttribute("aria-hidden"), "true");

    close.focus();
    await act(async () => {
      close.dispatchEvent(
        new window.KeyboardEvent("keydown", { bubbles: true, key: "Tab" }),
      );
    });
    assert.equal(window.document.activeElement === primary, true);

    primary.focus();
    await act(async () => {
      primary.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "Tab",
          shiftKey: true,
        }),
      );
    });
    assert.equal(window.document.activeElement === close, true);

    await act(async () => {
      window.document.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });
    await settle();
    assert.equal(window.document.querySelector('[role="dialog"]'), null);
    assert.equal(window.document.activeElement === trigger, true);
    assert.notEqual(container.inert, true);
    assert.equal(container.hasAttribute("aria-hidden"), false);

    await act(async () => trigger.click());
    await settle();
    const backdrop = window.document.querySelector(".combric-dialog__backdrop");
    await act(async () => {
      backdrop.dispatchEvent(
        new window.MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    await settle();
    assert.equal(window.document.querySelector('[role="dialog"]'), null);
  });
});

test("controlled Dialog remains authoritative and Drawer reuses modal semantics", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(
            Dialog,
            { onOpenChange: (open) => changes.push(open), open: true },
            createElement(DialogTrigger, null, "Dialog"),
            createElement(
              DialogContent,
              null,
              createElement(DialogTitle, null, "Controlled"),
              createElement(DialogDescription, null, "Description"),
              createElement(
                DialogClose,
                {
                  className: "prevent-close",
                  onClick: (event) => event.preventDefault(),
                },
                "Keep open",
              ),
              createElement(DialogClose, null, "Close"),
            ),
          ),
        ),
      );
    });
    await settle();
    const preventedClose = window.document.querySelector(".prevent-close");
    await act(async () => preventedClose.click());
    assert.deepEqual(changes, []);
    assert.ok(window.document.querySelector('[role="dialog"]'));
    const close = window.document.querySelectorAll(".combric-dialog__close")[1];
    await act(async () => close.click());
    assert.deepEqual(changes, [false]);
    assert.ok(window.document.querySelector('[role="dialog"]'));

    await act(async () => {
      root.render(
        createElement(
          Drawer,
          { defaultOpen: true },
          createElement(DrawerTrigger, null, "Drawer"),
          createElement(
            DrawerContent,
            { side: "left" },
            createElement(DrawerTitle, null, "Filters"),
            createElement(DrawerDescription, null, "Filter options"),
            createElement(DrawerClose, null, "Close"),
          ),
        ),
      );
    });
    await settle();
    const drawer = window.document.querySelector(".combric-drawer__content");
    assert.equal(drawer.getAttribute("role"), "dialog");
    assert.equal(drawer.dataset.side, "left");
    assert.equal(drawer.getAttribute("aria-modal"), "true");
  });
});

test("Dropdown Menu supports keyboard focus, disabled items, activation, and restoration", async () => {
  await withDom(async ({ container, root, window }) => {
    const selections = [];
    await act(async () => {
      root.render(
        createElement(
          DropdownMenu,
          null,
          createElement(DropdownMenuTrigger, null, "Actions"),
          createElement(
            DropdownMenuContent,
            null,
            createElement(
              DropdownMenuItem,
              { onSelect: () => selections.push("edit") },
              "Edit",
            ),
            createElement(DropdownMenuItem, { disabled: true }, "Disabled"),
            createElement(
              DropdownMenuItem,
              { onSelect: () => selections.push("archive") },
              "Archive",
            ),
            createElement(
              DropdownMenuItem,
              { onSelect: (event) => event.preventDefault() },
              "Keep open",
            ),
          ),
        ),
      );
    });

    const trigger = container.querySelector("button");
    trigger.focus();
    await act(async () => {
      trigger.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
        }),
      );
    });
    await settle();
    const menu = window.document.querySelector('[role="menu"]');
    const items = menu.querySelectorAll('[role="menuitem"]');
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(window.document.activeElement === items[0], true);

    await act(async () => {
      items[0].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowDown",
        }),
      );
    });
    assert.equal(window.document.activeElement === items[2], true);

    await act(async () => {
      items[2].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "Home",
        }),
      );
    });
    assert.equal(window.document.activeElement === items[0], true);

    await act(async () => {
      items[0].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "Enter",
        }),
      );
    });
    await settle();
    assert.deepEqual(selections, ["edit"]);
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement === trigger, true);

    await act(async () => {
      trigger.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowUp",
        }),
      );
    });
    await settle();
    let reopenedItems = window.document.querySelectorAll('[role="menuitem"]');
    assert.equal(window.document.activeElement === reopenedItems[3], true);
    await act(async () => {
      reopenedItems[3].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowUp",
        }),
      );
    });
    assert.equal(window.document.activeElement === reopenedItems[2], true);
    await act(async () => {
      reopenedItems[2].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "End",
        }),
      );
    });
    assert.equal(window.document.activeElement === reopenedItems[3], true);
    await act(async () => {
      reopenedItems[3].dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: " ",
        }),
      );
    });
    await settle();
    assert.ok(window.document.querySelector('[role="menu"]'));
    reopenedItems = window.document.querySelectorAll('[role="menuitem"]');
    await act(async () => reopenedItems[2].click());
    await settle();
    assert.deepEqual(selections, ["edit", "archive"]);

    await act(async () => trigger.click());
    await settle();
    const outside = window.document.querySelector("#outside");
    outside.focus();
    await act(async () => {
      outside.dispatchEvent(
        new window.MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement === outside, true);
  });
});

test("Popover is non-modal, dismisses outside or on Escape, and flips within viewport", async () => {
  await withDom(async ({ container, root, window }) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 200,
    });
    const portalTarget = window.document.querySelector("#portal-target");
    await act(async () => {
      root.render(
        createElement(
          Popover,
          null,
          createElement(PopoverTrigger, null, "Details"),
          createElement(
            PopoverContent,
            { container: portalTarget, side: "bottom" },
            createElement("button", null, "Inside"),
          ),
        ),
      );
    });
    const trigger = container.querySelector("button");
    trigger.getBoundingClientRect = () => ({
      bottom: 190,
      height: 20,
      left: 100,
      right: 150,
      top: 170,
      width: 50,
      x: 100,
      y: 170,
      toJSON() {},
    });
    trigger.focus();
    await act(async () => trigger.click());
    await settle();
    const content = window.document.querySelector(".combric-popover__content");
    assert.equal(content.closest("#portal-target") === portalTarget, true);
    content.getBoundingClientRect = () => ({
      bottom: 50,
      height: 50,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON() {},
    });
    await act(async () => window.dispatchEvent(new window.Event("resize")));
    assert.equal(content.dataset.side, "top");
    assert.equal(content.getAttribute("aria-modal"), null);
    assert.equal(window.document.activeElement === trigger, true);

    const outside = window.document.querySelector("#outside");
    outside.focus();
    await act(async () => {
      outside.dispatchEvent(
        new window.MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    assert.equal(
      window.document.querySelector(".combric-popover__content"),
      null,
    );
    assert.equal(window.document.activeElement === outside, true);

    trigger.focus();
    await act(async () => trigger.click());
    await settle();
    await act(async () => {
      window.document.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });
    await settle();
    assert.equal(window.document.activeElement === trigger, true);
  });
});

test("Tooltip responds to focus and pointer without stealing focus", async () => {
  await withDom(async ({ container, root, window }) => {
    await act(async () => {
      root.render(
        createElement(
          Tooltip,
          null,
          createElement(TooltipTrigger, null, "Help"),
          createElement(TooltipContent, null, "Helpful text"),
        ),
      );
    });
    const trigger = container.querySelector("button");
    await act(async () => trigger.focus());
    await settle();
    let tooltip = window.document.querySelector('[role="tooltip"]');
    assert.ok(tooltip);
    assert.match(trigger.getAttribute("aria-describedby"), /combric-tooltip/);
    assert.equal(window.document.activeElement === trigger, true);

    await act(async () => trigger.blur());
    assert.equal(window.document.querySelector('[role="tooltip"]'), null);

    await act(async () => {
      trigger.dispatchEvent(
        new window.MouseEvent("pointerover", { bubbles: true }),
      );
    });
    await settle();
    tooltip = window.document.querySelector('[role="tooltip"]');
    assert.ok(tooltip);
    assert.equal(window.document.activeElement === tooltip, false);

    await act(async () => {
      window.document.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });
    assert.equal(window.document.querySelector('[role="tooltip"]'), null);
  });
});

test("Toast portals a live region, closes accessibly, and cleans up its timer", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    const outside = window.document.querySelector("#outside");
    outside.focus();
    await act(async () => {
      root.render(
        createElement(
          ToastViewport,
          null,
          createElement(
            Toast,
            { duration: 10, onOpenChange: (open) => changes.push(open) },
            createElement(ToastTitle, null, "Saved"),
            createElement(ToastDescription, null, "Changes saved"),
            createElement(ToastClose, null, "Dismiss"),
          ),
          createElement(
            Toast,
            { duration: 0, priority: "assertive" },
            "Connection lost",
            createElement(ToastClose, null, "Dismiss urgent notice"),
          ),
        ),
      );
    });
    await settle();
    const viewport = window.document.querySelector('[role="region"]');
    assert.equal(viewport.getAttribute("aria-label"), "Notifications");
    assert.ok(viewport.closest("[data-combric-portal]"));
    assert.ok(viewport.querySelector('[role="status"]'));
    assert.ok(viewport.querySelector('[role="alert"]'));
    assert.equal(window.document.activeElement === outside, true);

    await act(
      async () => new Promise((resolve) => window.setTimeout(resolve, 20)),
    );
    assert.deepEqual(changes, [false]);
    assert.equal(viewport.querySelector('[role="status"]'), null);

    const dismiss = viewport.querySelector(".combric-toast__close");
    await act(async () => dismiss.click());
    assert.equal(viewport.querySelector('[role="alert"]'), null);
    assert.equal(window.document.activeElement === outside, true);

    const cleanupChanges = [];
    await act(async () => {
      root.render(
        createElement(
          ToastViewport,
          null,
          createElement(
            Toast,
            {
              duration: 10,
              onOpenChange: (open) => cleanupChanges.push(open),
            },
            "Temporary",
          ),
        ),
      );
    });
    await act(async () => {
      root.render(createElement(ToastViewport, null));
    });
    await act(
      async () => new Promise((resolve) => window.setTimeout(resolve, 20)),
    );
    assert.deepEqual(cleanupChanges, []);
  });
});

test("overlay modules remain SSR-import safe without browser globals", () => {
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(
        Dialog,
        { defaultOpen: true },
        createElement(DialogTrigger, null, "Dialog"),
        createElement(DialogContent, { "aria-label": "Dialog" }, "Content"),
      ),
      createElement(
        Popover,
        { defaultOpen: true },
        createElement(PopoverTrigger, null, "Popover"),
        createElement(PopoverContent, null, "Content"),
      ),
      createElement(
        Tooltip,
        { defaultOpen: true },
        createElement(TooltipTrigger, null, "Tooltip"),
        createElement(TooltipContent, null, "Content"),
      ),
      createElement(ToastViewport, null, createElement(Toast, null, "Notice")),
    ),
  );
  assert.match(markup, /Dialog/);
  assert.match(markup, /Popover/);
  assert.match(markup, /Tooltip/);
  assert.doesNotMatch(markup, /role="dialog"/);
  assert.doesNotMatch(markup, /role="tooltip"/);
});

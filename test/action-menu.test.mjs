import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import axeCore from "axe-core";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

const menuEntry = new URL("../packages/menu/dist/index.js", import.meta.url)
  .href;

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
  const dom = new JSDOM(
    '<button id="outside">Outside</button><div id="root"></div>',
    {
      runScripts: "outside-only",
      url: "https://consumer.example/",
    },
  );
  const previous = {
    document: globalThis.document,
    Element: globalThis.Element,
    Event: globalThis.Event,
    getComputedStyle: globalThis.getComputedStyle,
    HTMLElement: globalThis.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
    KeyboardEvent: globalThis.KeyboardEvent,
    MouseEvent: globalThis.MouseEvent,
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
    Event: dom.window.Event,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    KeyboardEvent: dom.window.KeyboardEvent,
    MouseEvent: dom.window.MouseEvent,
    Node: dom.window.Node,
    ResizeObserver,
    window: dom.window,
  });
  dom.window.ResizeObserver = ResizeObserver;
  dom.window.matchMedia = () => ({ matches: true });

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

async function press(window, target, key) {
  await act(async () => {
    target.dispatchEvent(
      new window.KeyboardEvent("keydown", { bubbles: true, key }),
    );
  });
}

function actionItems(menu) {
  return [...menu.querySelectorAll("[data-combric-action-menu-item]")];
}

test("Action Menu remains SSR-safe", () => {
  const probe = `
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import {
      ActionMenu,
      ActionMenuContent,
      ActionMenuItem,
      ActionMenuTrigger,
    } from ${JSON.stringify(menuEntry)};
    const markup = renderToStaticMarkup(
      createElement(
        ActionMenu,
        null,
        createElement(ActionMenuTrigger, null, "Actions"),
        createElement(
          ActionMenuContent,
          null,
          createElement(ActionMenuItem, null, "Edit"),
        ),
      ),
    );
    if (!markup.includes("Actions")) process.exit(1);
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", probe],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("Action Menu handles action, checkable, and radio menu semantics", async () => {
  await withDom(async ({ root, window }) => {
    const checkedChanges = [];
    const radioChanges = [];
    const selections = [];
    const {
      ActionMenu,
      ActionMenuCheckboxItem,
      ActionMenuContent,
      ActionMenuItem,
      ActionMenuLabel,
      ActionMenuRadioGroup,
      ActionMenuRadioItem,
      ActionMenuSeparator,
      ActionMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          ActionMenu,
          null,
          createElement(ActionMenuTrigger, null, "Actions"),
          createElement(
            ActionMenuContent,
            null,
            createElement(ActionMenuLabel, null, "Project"),
            createElement(
              ActionMenuItem,
              { onSelect: () => selections.push("edit") },
              "Edit",
            ),
            createElement(ActionMenuItem, { disabled: true }, "Archive"),
            createElement(
              ActionMenuCheckboxItem,
              {
                defaultChecked: true,
                onCheckedChange: (checked) => checkedChanges.push(checked),
              },
              "Show guides",
            ),
            createElement(ActionMenuSeparator),
            createElement(
              ActionMenuRadioGroup,
              {
                defaultValue: "grid",
                onValueChange: (value) => radioChanges.push(value),
              },
              createElement(ActionMenuRadioItem, { value: "grid" }, "Grid"),
              createElement(ActionMenuRadioItem, { value: "list" }, "List"),
            ),
          ),
        ),
      );
    });

    const trigger = window.document.querySelector("#root button");
    trigger.focus();
    await press(window, trigger, "ArrowDown");
    await settle();

    let menu = window.document.querySelector('[role="menu"]');
    const [edit, archive, guides, grid, list] = actionItems(menu);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(menu.getAttribute("aria-orientation"), "vertical");
    assert.equal(
      menu.querySelector('[role="presentation"]').textContent,
      "Project",
    );
    assert.ok(menu.querySelector('[role="separator"]'));
    assert.equal(window.document.activeElement, edit);
    assert.equal(archive.getAttribute("aria-disabled"), "true");
    assert.equal(archive.hasAttribute("disabled"), false);

    await press(window, edit, "ArrowDown");
    assert.equal(window.document.activeElement, archive);
    await press(window, archive, "Enter");
    await settle();
    assert.deepEqual(selections, []);
    assert.ok(window.document.querySelector('[role="menu"]'));

    await press(window, archive, "ArrowDown");
    assert.equal(window.document.activeElement, guides);
    await press(window, guides, " ");
    await settle();
    assert.equal(guides.getAttribute("aria-checked"), "false");
    assert.deepEqual(checkedChanges, [false]);
    assert.ok(window.document.querySelector('[role="menu"]'));

    await press(window, guides, "l");
    assert.equal(window.document.activeElement, list);
    await press(window, list, " ");
    await settle();
    assert.equal(grid.getAttribute("aria-checked"), "false");
    assert.equal(list.getAttribute("aria-checked"), "true");
    assert.deepEqual(radioChanges, ["list"]);

    window.eval(axeCore.source);
    const results = await window.axe.run(menu, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.equal(
      results.violations.length,
      0,
      JSON.stringify(results.violations, null, 2),
    );

    await press(window, list, "Escape");
    await settle();
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement, trigger);

    await press(window, trigger, "ArrowUp");
    await settle();
    menu = window.document.querySelector('[role="menu"]');
    const reopenedItems = actionItems(menu);
    assert.equal(window.document.activeElement, reopenedItems.at(-1));
    await press(window, reopenedItems.at(-1), "Home");
    assert.equal(window.document.activeElement, reopenedItems[0]);
    await press(window, reopenedItems[0], "End");
    assert.equal(window.document.activeElement, reopenedItems.at(-1));
    await press(window, reopenedItems.at(-1), "Tab");
    await settle();
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.notEqual(window.document.activeElement, trigger);

    await press(window, trigger, "ArrowDown");
    await settle();
    menu = window.document.querySelector('[role="menu"]');
    const reopenedEdit = actionItems(menu)[0];
    await press(window, reopenedEdit, "Enter");
    await settle();
    assert.deepEqual(selections, ["edit"]);
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement, trigger);
  });
});

test("Action Menu dismisses outside without stealing focus", async () => {
  await withDom(async ({ root, window }) => {
    const { ActionMenu, ActionMenuContent, ActionMenuItem, ActionMenuTrigger } =
      await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          ActionMenu,
          null,
          createElement(ActionMenuTrigger, null, "Actions"),
          createElement(
            ActionMenuContent,
            null,
            createElement(ActionMenuItem, null, "Edit"),
          ),
        ),
      );
    });

    const trigger = window.document.querySelector("#root button");
    const outside = window.document.querySelector("#outside");
    trigger.focus();
    await act(async () => trigger.click());
    await settle();
    outside.focus();
    await act(async () => {
      outside.dispatchEvent(
        new window.MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    await settle();

    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement, outside);
  });
});

test("a controlled Action Menu reports a selection without closing itself", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    const { ActionMenu, ActionMenuContent, ActionMenuItem, ActionMenuTrigger } =
      await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          ActionMenu,
          { onOpenChange: (open) => changes.push(open), open: true },
          createElement(ActionMenuTrigger, null, "Actions"),
          createElement(
            ActionMenuContent,
            null,
            createElement(ActionMenuItem, null, "Edit"),
          ),
        ),
      );
    });
    await settle();

    const menu = window.document.querySelector('[role="menu"]');
    await act(async () => actionItems(menu)[0].click());
    assert.deepEqual(changes, [false]);
    assert.ok(window.document.querySelector('[role="menu"]'));
  });
});

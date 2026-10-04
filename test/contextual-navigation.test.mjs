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

async function openContextMenu(window, trigger) {
  await act(async () => {
    trigger.dispatchEvent(
      new window.MouseEvent("contextmenu", {
        bubbles: true,
        clientX: 120,
        clientY: 160,
      }),
    );
  });
  await settle();
}

test("ContextMenu, Menubar, and BottomNavigation remain SSR-safe", () => {
  const probe = `
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import {
      BottomNavigation,
      BottomNavigationLink,
      BottomNavigationList,
      ContextMenu,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuTrigger,
      Menubar,
      MenubarContent,
      MenubarItem,
      MenubarMenu,
      MenubarTrigger,
    } from ${JSON.stringify(menuEntry)};
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(
          ContextMenu,
          null,
          createElement(ContextMenuTrigger, null, "Canvas"),
          createElement(ContextMenuContent, null, createElement(ContextMenuItem, null, "Paste")),
        ),
        createElement(
          Menubar,
          { "aria-label": "Application" },
          createElement(
            MenubarMenu,
            { value: "file" },
            createElement(MenubarTrigger, null, "File"),
            createElement(MenubarContent, null, createElement(MenubarItem, null, "New")),
          ),
        ),
        createElement(
          BottomNavigation,
          { "aria-label": "Mobile" },
          createElement(
            BottomNavigationList,
            null,
            createElement(BottomNavigationLink, { href: "/home" }, "Home"),
          ),
        ),
      ),
    );
    if (!markup.includes("Canvas") || !markup.includes("File")) process.exit(1);
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", probe],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("ContextMenu positions actions, supports typeahead, and restores focus", async () => {
  await withDom(async ({ root, window }) => {
    const selections = [];
    const {
      ContextMenu,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuLabel,
      ContextMenuSeparator,
      ContextMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          ContextMenu,
          null,
          createElement(ContextMenuTrigger, { tabIndex: 0 }, "Canvas"),
          createElement(
            ContextMenuContent,
            null,
            createElement(ContextMenuLabel, null, "Canvas"),
            createElement(
              ContextMenuItem,
              { onSelect: () => selections.push("copy") },
              "Copy",
            ),
            createElement(ContextMenuItem, { disabled: true }, "Cut"),
            createElement(ContextMenuSeparator),
            createElement(
              ContextMenuItem,
              { onSelect: () => selections.push("paste") },
              "Paste",
            ),
          ),
        ),
      );
    });

    const trigger = window.document.querySelector("#root [tabindex='0']");
    trigger.focus();
    await openContextMenu(window, trigger);

    const menu = window.document.querySelector('[role="menu"]');
    const [copy, cut, paste] = menu.querySelectorAll('[role="menuitem"]');
    assert.equal(menu.getAttribute("aria-labelledby"), trigger.id);
    assert.equal(window.document.activeElement, copy);
    assert.equal(cut.getAttribute("aria-disabled"), "true");

    await press(window, copy, "p");
    assert.equal(window.document.activeElement, paste);
    await press(window, paste, "Escape");
    await settle();
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement, trigger);

    await press(window, trigger, "ContextMenu");
    await settle();
    assert.ok(window.document.querySelector('[role="menu"]'));
    await press(
      window,
      window.document.querySelector('[role="menuitem"]'),
      "Escape",
    );
    await settle();

    await openContextMenu(window, trigger);
    const reopenedPaste =
      window.document.querySelectorAll('[role="menuitem"]')[2];
    await act(async () => reopenedPaste.click());
    await settle();
    assert.deepEqual(selections, ["paste"]);
    assert.equal(window.document.querySelector('[role="menu"]'), null);

    await openContextMenu(window, trigger);
    const accessibleMenu = window.document.querySelector('[role="menu"]');
    window.eval(axeCore.source);
    const results = await window.axe.run(accessibleMenu, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.equal(
      results.violations.length,
      0,
      JSON.stringify(results.violations, null, 2),
    );
  });
});

test("ContextMenu dismisses outside and a controlled menu remains authoritative", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    const {
      ContextMenu,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          ContextMenu,
          null,
          createElement(ContextMenuTrigger, { tabIndex: 0 }, "Uncontrolled"),
          createElement(
            ContextMenuContent,
            null,
            createElement(ContextMenuItem, null, "Copy"),
          ),
        ),
      );
    });
    const trigger = window.document.querySelector("#root [tabindex='0']");
    await openContextMenu(window, trigger);
    const outside = window.document.querySelector("#outside");
    outside.focus();
    await act(async () => {
      outside.dispatchEvent(
        new window.MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    await settle();
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement, outside);

    await act(async () => root.render(null));
    await settle();
    await act(async () => {
      root.render(
        createElement(
          ContextMenu,
          { onOpenChange: (open) => changes.push(open), open: true },
          createElement(ContextMenuTrigger, { tabIndex: 0 }, "Controlled"),
          createElement(
            ContextMenuContent,
            null,
            createElement(ContextMenuItem, null, "Copy"),
          ),
        ),
      );
    });
    const controlledTrigger = window.document.querySelector(
      "#root [tabindex='0']",
    );
    await openContextMenu(window, controlledTrigger);
    const item = window.document.querySelector('[role="menuitem"]');
    await act(async () => item.click());
    assert.deepEqual(changes, [false]);
    assert.ok(window.document.querySelector('[role="menu"]'));
  });
});

test("Menubar uses application-menu roles and keyboard navigation", async () => {
  await withDom(async ({ root, window }) => {
    const selections = [];
    const {
      Menubar,
      MenubarContent,
      MenubarItem,
      MenubarLabel,
      MenubarMenu,
      MenubarSeparator,
      MenubarTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          Menubar,
          { "aria-label": "Application menu" },
          createElement(
            MenubarMenu,
            { value: "file" },
            createElement(MenubarTrigger, null, "File"),
            createElement(
              MenubarContent,
              null,
              createElement(MenubarLabel, null, "File"),
              createElement(
                MenubarItem,
                { onSelect: () => selections.push("new") },
                "New",
              ),
              createElement(MenubarItem, { disabled: true }, "Open"),
              createElement(MenubarSeparator),
              createElement(MenubarItem, null, "Save"),
            ),
          ),
          createElement(
            MenubarMenu,
            { value: "edit" },
            createElement(MenubarTrigger, null, "Edit"),
            createElement(
              MenubarContent,
              null,
              createElement(MenubarItem, null, "Undo"),
              createElement(MenubarItem, null, "Redo"),
            ),
          ),
        ),
      );
    });

    const menubar = window.document.querySelector('[role="menubar"]');
    const [file, edit] = menubar.querySelectorAll(
      "[data-combric-menubar-trigger]",
    );
    file.focus();
    await press(window, file, "ArrowDown");
    await settle();

    let menu = window.document.querySelector('[role="menu"]');
    const [newItem, openItem, saveItem] =
      menu.querySelectorAll('[role="menuitem"]');
    assert.equal(file.getAttribute("aria-expanded"), "true");
    assert.equal(window.document.activeElement, newItem);
    assert.equal(openItem.getAttribute("aria-disabled"), "true");

    await press(window, newItem, "ArrowDown");
    assert.equal(window.document.activeElement, saveItem);
    await press(window, saveItem, "Escape");
    await settle();
    assert.equal(window.document.querySelector('[role="menu"]'), null);
    assert.equal(window.document.activeElement, file);

    await press(window, file, "ArrowDown");
    await settle();
    await act(async () =>
      window.document.querySelector('[role="menu"] [role="menuitem"]').click(),
    );
    await settle();
    assert.deepEqual(selections, ["new"]);
    assert.equal(window.document.querySelector('[role="menu"]'), null);

    await press(window, file, "ArrowRight");
    assert.equal(window.document.activeElement, edit);
    await press(window, edit, "ArrowUp");
    await settle();
    menu = window.document.querySelector('[role="menu"]');
    const [, redo] = menu.querySelectorAll('[role="menuitem"]');
    assert.equal(window.document.activeElement, redo);

    window.eval(axeCore.source);
    const results = await window.axe.run(menubar, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.equal(
      results.violations.length,
      0,
      JSON.stringify(results.violations, null, 2),
    );
  });
});

test("a controlled Menubar reports changes without changing its open menu", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    const {
      Menubar,
      MenubarContent,
      MenubarItem,
      MenubarMenu,
      MenubarTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          Menubar,
          { onValueChange: (value) => changes.push(value), value: "file" },
          createElement(
            MenubarMenu,
            { value: "file" },
            createElement(MenubarTrigger, null, "File"),
            createElement(
              MenubarContent,
              null,
              createElement(MenubarItem, null, "New"),
            ),
          ),
        ),
      );
    });
    await settle();

    const trigger = window.document.querySelector(
      "[data-combric-menubar-trigger]",
    );
    await act(async () => trigger.click());
    assert.deepEqual(changes, [null]);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
  });
});

test("BottomNavigation preserves native navigation structure and router rendering", async () => {
  await withDom(async ({ root, window }) => {
    const { BottomNavigation, BottomNavigationLink, BottomNavigationList } =
      await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          BottomNavigation,
          { "aria-label": "Mobile navigation" },
          createElement(
            BottomNavigationList,
            null,
            createElement(
              BottomNavigationLink,
              { active: true, href: "/home", leading: "⌂" },
              "Home",
            ),
            createElement(
              BottomNavigationLink,
              {
                render: (props) =>
                  createElement("a", {
                    ...props,
                    "data-router-link": "true",
                    href: "/inbox",
                  }),
              },
              "Inbox",
            ),
          ),
        ),
      );
    });

    const navigation = window.document.querySelector("nav");
    const [home, inbox] = navigation.querySelectorAll("a");
    assert.equal(navigation.getAttribute("aria-label"), "Mobile navigation");
    assert.equal(navigation.querySelector("ul").children.length, 2);
    assert.equal(navigation.querySelector('[role="menu"]'), null);
    assert.equal(home.getAttribute("aria-current"), "page");
    assert.equal(inbox.getAttribute("data-router-link"), "true");
  });
});

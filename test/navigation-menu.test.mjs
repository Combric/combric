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

test("NavigationMenu and MegaMenu remain SSR-safe", () => {
  const probe = `
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import {
      MegaMenu,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuList,
      NavigationMenuTrigger,
    } from ${JSON.stringify(menuEntry)};
    const markup = renderToStaticMarkup(
      createElement(
        MegaMenu,
        { "aria-label": "Primary" },
        createElement(
          NavigationMenuList,
          null,
          createElement(
            NavigationMenuItem,
            { value: "products" },
            createElement(NavigationMenuTrigger, null, "Products"),
            createElement(NavigationMenuContent, null, "Panel"),
          ),
        ),
      ),
    );
    if (!markup.includes("Products")) process.exit(1);
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", probe],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("NavigationMenu supports rich disclosure panels and router links", async () => {
  await withDom(async ({ root, window }) => {
    const {
      NavigationMenu,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuList,
      NavigationMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          NavigationMenu,
          { "aria-label": "Primary navigation", defaultValue: "products" },
          createElement(
            NavigationMenuList,
            null,
            createElement(
              NavigationMenuItem,
              { value: "products" },
              createElement(NavigationMenuTrigger, null, "Products"),
              createElement(
                NavigationMenuContent,
                null,
                createElement(
                  "a",
                  { href: "/products/atlas" },
                  createElement("img", {
                    alt: "Atlas dashboard preview",
                    src: "/atlas.png",
                  }),
                  createElement("strong", null, "Atlas"),
                  createElement("span", null, "Planning workspace"),
                ),
                createElement("a", { href: "/products/orbit" }, "Orbit"),
              ),
            ),
            createElement(
              NavigationMenuLink,
              {
                render: (props) =>
                  createElement("a", {
                    ...props,
                    "data-router-link": "true",
                    href: "/docs",
                  }),
              },
              "Docs",
            ),
          ),
        ),
      );
    });
    await settle();

    const navigation = window.document.querySelector("nav");
    const trigger = navigation.querySelector("button");
    const content = window.document.getElementById(
      trigger.getAttribute("aria-controls"),
    );
    const routerLink = navigation.querySelector('[data-router-link="true"]');

    assert.equal(navigation.getAttribute("aria-label"), "Primary navigation");
    assert.equal(navigation.querySelector("ul").children.length, 2);
    assert.equal(navigation.querySelector('[role="menu"]'), null);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(content.getAttribute("role"), "region");
    assert.equal(content.getAttribute("aria-labelledby"), trigger.id);
    assert.equal(content.querySelector("img").alt, "Atlas dashboard preview");
    assert.equal(routerLink.getAttribute("href"), "/docs");

    window.eval(axeCore.source);
    const results = await window.axe.run(navigation, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.equal(
      results.violations.length,
      0,
      JSON.stringify(results.violations, null, 2),
    );
  });
});

test("NavigationMenu keyboard and dismissal behavior preserve focus", async () => {
  await withDom(async ({ root, window }) => {
    const {
      NavigationMenu,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuList,
      NavigationMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          NavigationMenu,
          { "aria-label": "Primary navigation" },
          createElement(
            NavigationMenuList,
            null,
            createElement(
              NavigationMenuItem,
              { value: "products" },
              createElement(NavigationMenuTrigger, null, "Products"),
              createElement(
                NavigationMenuContent,
                null,
                createElement("a", { href: "/products/atlas" }, "Atlas"),
              ),
            ),
            createElement(
              NavigationMenuItem,
              { value: "platform" },
              createElement(NavigationMenuTrigger, null, "Platform"),
              createElement(
                NavigationMenuContent,
                null,
                createElement("a", { href: "/platform/api" }, "API"),
              ),
            ),
          ),
        ),
      );
    });

    const [products, platform] =
      window.document.querySelectorAll("#root button");
    products.focus();
    await press(window, products, "ArrowDown");
    await settle();

    let productsContent = window.document.getElementById(
      products.getAttribute("aria-controls"),
    );
    const atlas = productsContent.querySelector("a");
    assert.equal(products.getAttribute("aria-expanded"), "true");
    assert.equal(window.document.activeElement, atlas);

    await press(window, atlas, "Escape");
    await settle();
    assert.equal(products.getAttribute("aria-expanded"), "false");
    assert.equal(window.document.activeElement, products);

    platform.focus();
    await act(async () => platform.click());
    await settle();
    assert.equal(products.getAttribute("aria-expanded"), "false");
    assert.equal(platform.getAttribute("aria-expanded"), "true");
    assert.equal(window.document.activeElement, platform);

    const outside = window.document.querySelector("#outside");
    outside.focus();
    await act(async () => {
      outside.dispatchEvent(
        new window.MouseEvent("pointerdown", { bubbles: true }),
      );
    });
    await settle();
    assert.equal(platform.getAttribute("aria-expanded"), "false");
    assert.equal(window.document.activeElement, outside);

    productsContent = window.document.getElementById(
      products.getAttribute("aria-controls"),
    );
    assert.equal(productsContent, null);
  });
});

test("a bare NavigationMenu switches its active disclosure", async () => {
  await withDom(async ({ root, window }) => {
    const {
      NavigationMenu,
      NavigationMenuItem,
      NavigationMenuList,
      NavigationMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          NavigationMenu,
          null,
          createElement(
            NavigationMenuList,
            null,
            createElement(
              NavigationMenuItem,
              { value: "products" },
              createElement(NavigationMenuTrigger, null, "Products"),
            ),
            createElement(
              NavigationMenuItem,
              { value: "platform" },
              createElement(NavigationMenuTrigger, null, "Platform"),
            ),
          ),
        ),
      );
    });

    const [products, platform] =
      window.document.querySelectorAll("#root button");
    await act(async () => products.click());
    await settle();
    await act(async () => platform.click());
    await settle();

    assert.equal(products.getAttribute("aria-expanded"), "false");
    assert.equal(platform.getAttribute("aria-expanded"), "true");
  });
});

test("a controlled NavigationMenu reports its requested panel without changing itself", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    const {
      MegaMenu,
      MegaMenuContent,
      MegaMenuItem,
      MegaMenuList,
      MegaMenuTrigger,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          MegaMenu,
          {
            onValueChange: (value) => changes.push(value),
            value: "products",
          },
          createElement(
            MegaMenuList,
            null,
            createElement(
              MegaMenuItem,
              { value: "products" },
              createElement(MegaMenuTrigger, null, "Products"),
              createElement(MegaMenuContent, null, "Panel"),
            ),
            createElement(
              MegaMenuItem,
              { value: "platform" },
              createElement(MegaMenuTrigger, null, "Platform"),
              createElement(MegaMenuContent, null, "Panel"),
            ),
          ),
        ),
      );
    });

    const [products, platform] =
      window.document.querySelectorAll("#root button");
    await act(async () => products.click());
    assert.deepEqual(changes, [null]);
    assert.equal(products.getAttribute("aria-expanded"), "true");

    await act(async () => platform.click());
    assert.deepEqual(changes, [null, "platform"]);
    assert.equal(products.getAttribute("aria-expanded"), "true");
    assert.equal(platform.getAttribute("aria-expanded"), "false");
  });
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import axeCore from "axe-core";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

const menuEntry = new URL("../packages/menu/dist/index.js", import.meta.url)
  .href;

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', {
    runScripts: "outside-only",
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
}

test("Navigation and SideNav remain SSR-safe", () => {
  const probe = `
    import { createElement } from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import {
      Navigation,
      NavigationItem,
      NavigationLink,
      NavigationList,
      SideNav,
      SideNavNavigation,
    } from ${JSON.stringify(menuEntry)};
    const markup = renderToStaticMarkup(
      createElement(
        SideNav,
        null,
        createElement(
          SideNavNavigation,
          { "aria-label": "Workspace" },
          createElement(
            NavigationList,
            null,
            createElement(
              NavigationItem,
              null,
              createElement(NavigationLink, { href: "/projects" }, "Projects"),
            ),
          ),
        ),
      ),
    );
    if (!markup.includes("Projects")) process.exit(1);
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", probe],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("Navigation preserves native landmarks, list structure, and router rendering", async () => {
  await withDom(async ({ root, window }) => {
    const { Navigation, NavigationItem, NavigationLink, NavigationList } =
      await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          Navigation,
          { "aria-label": "Primary navigation" },
          createElement(
            NavigationList,
            null,
            createElement(
              NavigationItem,
              null,
              createElement(
                NavigationLink,
                { active: true, href: "/dashboard", trailing: "⌘ D" },
                "Dashboard",
              ),
            ),
            createElement(
              NavigationItem,
              null,
              createElement(
                NavigationLink,
                {
                  render: (props) =>
                    createElement("a", {
                      ...props,
                      "data-router-link": "true",
                      href: "/projects",
                    }),
                },
                "Projects",
              ),
            ),
          ),
        ),
      );
    });

    const navigation = window.document.querySelector("nav");
    const list = navigation.querySelector("ul");
    const [dashboard, projects] = navigation.querySelectorAll("a");
    assert.equal(navigation.getAttribute("aria-label"), "Primary navigation");
    assert.equal(list.children.length, 2);
    assert.equal(navigation.querySelector('[role="menu"]'), null);
    assert.equal(dashboard.getAttribute("aria-current"), "page");
    assert.equal(dashboard.dataset.state, "active");
    assert.equal(projects.getAttribute("data-router-link"), "true");
    assert.equal(projects.getAttribute("href"), "/projects");
  });
});

test("SideNav composes complementary navigation and disclosure groups", async () => {
  await withDom(async ({ root, window }) => {
    const {
      SideNav,
      SideNavContent,
      SideNavFooter,
      SideNavGroup,
      SideNavGroupContent,
      SideNavGroupTrigger,
      SideNavHeader,
      SideNavItem,
      SideNavLink,
      SideNavList,
      SideNavNavigation,
    } = await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          SideNav,
          { "aria-label": "Workspace shell" },
          createElement(SideNavHeader, null, "Acme"),
          createElement(
            SideNavContent,
            null,
            createElement(
              SideNavNavigation,
              { "aria-label": "Workspace navigation" },
              createElement(
                SideNavList,
                null,
                createElement(
                  SideNavItem,
                  null,
                  createElement(
                    SideNavLink,
                    { active: true, href: "/overview" },
                    "Overview",
                  ),
                ),
                createElement(
                  SideNavGroup,
                  { defaultOpen: true },
                  createElement(SideNavGroupTrigger, null, "Projects"),
                  createElement(
                    SideNavGroupContent,
                    null,
                    createElement(
                      SideNavItem,
                      null,
                      createElement(
                        SideNavLink,
                        { href: "/projects/a" },
                        "Alpha",
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          createElement(SideNavFooter, null, "Signed in"),
        ),
      );
    });

    const sideNav = window.document.querySelector("aside");
    const navigation = sideNav.querySelector("nav");
    const trigger = sideNav.querySelector("button");
    const content = window.document.getElementById(
      trigger.getAttribute("aria-controls"),
    );
    assert.equal(sideNav.getAttribute("aria-label"), "Workspace shell");
    assert.equal(navigation.getAttribute("aria-label"), "Workspace navigation");
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(content.hidden, false);
    assert.equal(content.getAttribute("aria-labelledby"), trigger.id);
    assert.equal(sideNav.querySelector('[role="menu"]'), null);

    await act(async () => trigger.click());
    await settle();
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(content.hidden, true);

    await act(async () => trigger.click());
    await settle();
    assert.equal(content.hidden, false);

    window.eval(axeCore.source);
    const results = await window.axe.run(sideNav, {
      rules: { "color-contrast": { enabled: false } },
    });
    assert.equal(
      results.violations.length,
      0,
      JSON.stringify(results.violations, null, 2),
    );
  });
});

test("a controlled SideNav group reports a requested state without changing itself", async () => {
  await withDom(async ({ root, window }) => {
    const changes = [];
    const { SideNavGroup, SideNavGroupContent, SideNavGroupTrigger } =
      await import(menuEntry);

    await act(async () => {
      root.render(
        createElement(
          "ul",
          null,
          createElement(
            SideNavGroup,
            { onOpenChange: (open) => changes.push(open), open: true },
            createElement(SideNavGroupTrigger, null, "Projects"),
            createElement(SideNavGroupContent, null),
          ),
        ),
      );
    });

    const trigger = window.document.querySelector("button");
    await act(async () => trigger.click());
    assert.deepEqual(changes, [false]);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
  });
});

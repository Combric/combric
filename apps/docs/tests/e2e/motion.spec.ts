import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

async function expectRunningTransition(locator: Locator): Promise<void> {
  await expect
    .poll(() =>
      locator.evaluate((element) =>
        element
          .getAnimations()
          .some((animation) => animation.playState === "running"),
      ),
    )
    .toBe(true);
}

async function finishCurrentTransitions(locator: Locator): Promise<void> {
  await locator.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations()
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function expectNoTransition(locator: Locator): Promise<void> {
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return (
          style.transitionDuration
            .split(",")
            .every((duration) => duration.trim() === "0s") &&
          style.animationName === "none"
        );
      }),
    )
    .toBe(true);
}

async function resetTransitionEvents(page: Page): Promise<void> {
  await page
    .locator("html")
    .evaluate((element) => delete element.dataset.combricTransitionEvents);
}

async function expectTransitionRun(
  page: Page,
  state: "open" | "closed",
): Promise<void> {
  await expect
    .poll(() =>
      page.locator("html").getAttribute("data-combric-transition-events"),
    )
    .toContain(`${state}:`);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener(
      "transitionrun",
      (event) => {
        const element = event.target;
        if (!(element instanceof HTMLElement)) return;
        const state = element.dataset.state;
        if (state !== "open" && state !== "closed") return;
        const previous =
          document.documentElement.dataset.combricTransitionEvents ?? "";
        document.documentElement.dataset.combricTransitionEvents = [
          previous,
          `${state}:${(event as TransitionEvent).propertyName}`,
        ]
          .filter(Boolean)
          .join(",");
      },
      true,
    );
  });
});

test.describe("Combric motion in Chromium", () => {
  test("Accordion and Collapsible animate intrinsic disclosure dimensions", async ({
    page,
  }) => {
    await page.goto("/components/disclosure/accordion/");
    const accordionTrigger = page.getByRole("button", { name: "Details" });
    const accordionContent = page.locator(".combric-accordion__content");
    await expect(accordionTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(accordionContent).toBeVisible();
    await resetTransitionEvents(page);
    await accordionTrigger.click();
    await expect(accordionTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(accordionContent).toBeVisible();
    await expectTransitionRun(page, "closed");
    await expect(accordionContent).toBeHidden();

    await resetTransitionEvents(page);
    await accordionTrigger.click();
    await expect(accordionTrigger).toHaveAttribute("aria-expanded", "true");
    await expectTransitionRun(page, "open");
    const openHeight = await accordionContent.evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    expect(openHeight).toBeGreaterThan(0);
    expect(
      await accordionContent.evaluate((element) => element.scrollHeight),
    ).toBeLessThanOrEqual(openHeight + 1);

    await page.goto("/components/disclosure/collapsible/");
    const collapsibleTrigger = page.getByRole("button", {
      name: "Technical details",
    });
    const collapsibleContent = page.locator(".combric-collapsible__content");
    await expect(collapsibleTrigger).toHaveAttribute("aria-expanded", "true");
    await resetTransitionEvents(page);
    await collapsibleTrigger.click();
    await expect(collapsibleTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(collapsibleContent).toBeVisible();
    await expectTransitionRun(page, "closed");
    await expect(collapsibleContent).toBeHidden();

    await resetTransitionEvents(page);
    await collapsibleTrigger.click();
    await expect(collapsibleTrigger).toHaveAttribute("aria-expanded", "true");
    await expectTransitionRun(page, "open");
    await collapsibleContent.dispatchEvent("transitionend", {
      bubbles: true,
      propertyName: "block-size",
    });
    await expect(collapsibleContent).toBeVisible();
    await expect(collapsibleContent).not.toHaveAttribute("hidden", "");
  });

  test("Dialog and left/right Drawer run enter and exit transitions", async ({
    page,
  }) => {
    await page.goto("/components/overlays/dialog/");
    const dialogTrigger = page.getByRole("button", { name: "Open dialog" });
    await dialogTrigger.click();
    const dialog = page.locator(".combric-dialog__content");
    await expect(dialog).toHaveAttribute("data-state", "open");
    await expectRunningTransition(dialog);
    await expect(dialog).toHaveCSS("transition-duration", /180ms|0\.18s/);
    await finishCurrentTransitions(dialog);
    await finishCurrentTransitions(page.locator(".combric-dialog__backdrop"));
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await resetTransitionEvents(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("data-state", "closed");
    await expectTransitionRun(page, "closed");
    await expect(dialog).toHaveCount(0);
    await expect(dialogTrigger).toBeFocused();

    await page.goto("/components/overlays/drawer/");
    const leftTrigger = page.getByRole("button", { name: "Open left drawer" });
    await leftTrigger.click();
    let drawer = page.locator('.combric-drawer__content[data-side="left"]');
    await expect(drawer).toHaveAttribute("data-state", "open");
    await expectRunningTransition(drawer);
    await finishCurrentTransitions(drawer);
    await finishCurrentTransitions(page.locator(".combric-drawer__backdrop"));
    await resetTransitionEvents(page);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("data-state", "closed");
    await expectTransitionRun(page, "closed");
    await expect(drawer).toHaveCount(0);

    const rightTrigger = page.getByRole("button", { name: "Filters" });
    await rightTrigger.click();
    drawer = page.locator('.combric-drawer__content[data-side="right"]');
    await expect(drawer).toHaveAttribute("data-state", "open");
    await expectRunningTransition(drawer);
    await finishCurrentTransitions(drawer);
    await finishCurrentTransitions(page.locator(".combric-drawer__backdrop"));
    await resetTransitionEvents(page);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("data-state", "closed");
    await expectTransitionRun(page, "closed");
    await expect(drawer).toHaveCount(0);
  });

  test("Dropdown, Popover and Tooltip retain logical close through visual exit", async ({
    page,
  }) => {
    await page.goto("/components/overlays/dropdown-menu/");
    const menuTrigger = page.getByRole("button", { name: "Actions" });
    await menuTrigger.click();
    const menu = page.locator(".combric-dropdown-menu__content");
    await expect(menu).toHaveAttribute("data-state", "open");
    await expectRunningTransition(menu);
    await finishCurrentTransitions(menu);
    await resetTransitionEvents(page);
    await page.keyboard.press("Escape");
    await expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toHaveAttribute("data-state", "closed");
    await expectTransitionRun(page, "closed");
    await expect(menu).toHaveCount(0);
    await expect(menuTrigger).toBeFocused();

    await menuTrigger.click();
    await expect(menu).toHaveAttribute("data-state", "open");
    await finishCurrentTransitions(menu);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("data-state", "closed");
    await menuTrigger.click();
    await expect(menu).toHaveAttribute("data-state", "open");
    await finishCurrentTransitions(menu);
    await expect(menu).toBeVisible();

    await page.goto("/components/overlays/popover/");
    const popoverTrigger = page.getByRole("button", { name: "Details" });
    const popover = page.locator(".combric-popover__content");
    await popoverTrigger.click();
    await expect(popover).toHaveAttribute("data-state", "open");
    await expectRunningTransition(popover);
    await finishCurrentTransitions(popover);
    await resetTransitionEvents(page);
    await page.keyboard.press("Escape");
    await expect(popover).toHaveAttribute("data-state", "closed");
    await expectTransitionRun(page, "closed");
    await expect(popover).toHaveCount(0);

    await page.goto("/components/overlays/tooltip/");
    const tooltipTrigger = page.getByRole("button", { name: "Help" });
    await tooltipTrigger.focus();
    const tooltip = page.locator(".combric-tooltip__content");
    await expect(tooltip).toHaveAttribute("data-state", "open");
    await expectRunningTransition(tooltip);
    await finishCurrentTransitions(tooltip);
    await expect(tooltipTrigger).toHaveAttribute(
      "aria-describedby",
      /combric-tooltip/,
    );
    await resetTransitionEvents(page);
    await page.keyboard.press("Escape");
    await expect(tooltipTrigger).not.toHaveAttribute(
      "aria-describedby",
      /combric-tooltip/,
    );
    await expect(tooltip).toHaveAttribute("data-state", "closed");
    await expectTransitionRun(page, "closed");
    await expect(tooltip).toHaveCount(0);
  });

  test("Toast animates manual and automatic exit without changing live semantics", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/components/feedback/toast/");
    const viewport = page.getByRole("list", { name: "Notifications" });
    const manualToast = page
      .getByText("Saved", { exact: true })
      .locator("xpath=ancestor::li");
    const automaticToast = page
      .getByText("Automatic notice", { exact: true })
      .locator("xpath=ancestor::li");
    await expect(viewport).toBeVisible();
    await expect(manualToast.locator('[role="status"]')).toBeVisible();
    await expect(manualToast).toHaveAttribute("data-state", "open");
    await expect(automaticToast).toHaveAttribute("data-state", "open");
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(manualToast).toHaveAttribute("data-state", "closed");
    await expect(manualToast).toBeVisible();
    await expectRunningTransition(manualToast);
    await expect(manualToast).toHaveCount(0);

    await page.clock.fastForward(5000);
    await expect(automaticToast).toHaveAttribute("data-state", "closed");
    await expect(automaticToast).toBeVisible();
    await expectRunningTransition(automaticToast);
    await expect(automaticToast).toHaveCount(0);
  });

  test("Switch and Tabs expose active CSS transitions", async ({ page }) => {
    await page.goto("/components/forms/switch/");
    const switchControl = page.getByRole("switch", { name: "Notifications" });
    const switchDuration = await switchControl.evaluate(
      (element) => getComputedStyle(element, "::after").transitionDuration,
    );
    expect(switchDuration).not.toBe("0s");
    const initiallyChecked = await switchControl.isChecked();
    await switchControl.click();
    await expect(switchControl).toBeChecked({ checked: !initiallyChecked });

    await page.goto("/components/navigation/tabs/");
    const activity = page.getByRole("tab", { name: "Activity" });
    const tabDuration = await activity.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    );
    expect(tabDuration).not.toBe("0s");
    await activity.click();
    await expect(activity).toHaveAttribute("aria-selected", "true");
    await expectRunningTransition(activity);
  });

  test("consumer motion tokens customize overlays, controls and disclosures", async ({
    page,
  }) => {
    const overrides = `
      :root {
        --combric-motion-duration-micro: 37ms;
        --combric-motion-duration-normal: 333ms;
        --combric-motion-easing-standard: linear;
        --combric-motion-easing-enter: ease-in;
        --combric-motion-easing-exit: ease-out;
      }
    `;

    await page.goto("/components/overlays/dialog/");
    await page.addStyleTag({ content: overrides });
    await page.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.locator(".combric-dialog__content");
    await expect(dialog).toHaveAttribute("data-presence", "entered");
    await finishCurrentTransitions(dialog);
    await expect(dialog).toHaveCSS("transition-duration", /333ms|0\.333s/);
    await expect(dialog).toHaveCSS("transition-timing-function", /ease-in/);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("data-state", "closed");
    await expect(dialog).toHaveCSS("transition-timing-function", /ease-out/);
    await expect(dialog).toHaveCount(0);

    await page.goto("/components/overlays/dropdown-menu/");
    await page.addStyleTag({ content: overrides });
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.locator(".combric-dropdown-menu__content")).toHaveCSS(
      "transition-duration",
      /333ms|0\.333s/,
    );

    await page.goto("/components/forms/switch/");
    await page.addStyleTag({ content: overrides });
    const switchControl = page.getByRole("switch", { name: "Notifications" });
    expect(
      await switchControl.evaluate(
        (element) => getComputedStyle(element, "::after").transitionDuration,
      ),
    ).toMatch(/37ms|0\.037s/);

    await page.goto("/components/disclosure/accordion/");
    await page.addStyleTag({ content: overrides });
    await expect(page.locator(".combric-accordion__content")).toHaveCSS(
      "transition-duration",
      /333ms|0\.333s/,
    );
  });

  test("global and per-component opt-outs clean up without visual transitions", async ({
    page,
  }) => {
    await page.goto("/components/overlays/dialog/");
    await page.locator("html").evaluate((element) => {
      element.dataset.combricMotion = "off";
    });
    await page.getByRole("button", { name: "Open dialog" }).click();
    let content = page.locator(".combric-dialog__content");
    await expect(content).toHaveAttribute("data-state", "open");
    await expectNoTransition(content);
    await page.keyboard.press("Escape");
    await expect(content).toHaveCount(0);

    await page.goto("/components/overlays/dropdown-menu/");
    await page.addStyleTag({
      content:
        ".no-motion { transition: none !important; animation: none !important; }",
    });
    const menuTrigger = page.getByRole("button", { name: "Actions" });
    await menuTrigger.click();
    content = page.locator(".combric-dropdown-menu__content");
    await content.evaluate((element) => element.classList.add("no-motion"));
    await expectNoTransition(content);
    await page.keyboard.press("Escape");
    await expect(content).toHaveCount(0);

    await page.clock.install();
    await page.goto("/components/feedback/toast/");
    await page.addStyleTag({
      content:
        ".no-motion { transition: none !important; animation: none !important; }",
    });
    const toast = page
      .getByText("Saved", { exact: true })
      .locator("xpath=ancestor::li");
    await toast.evaluate((element) => element.classList.add("no-motion"));
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(toast).toHaveCount(0);
  });

  test("custom CSS owns presentation while presence follows actual duration and interruption", async ({
    page,
  }) => {
    await page.goto("/components/overlays/dropdown-menu/");
    await page.addStyleTag({
      content: `
        .motion-long { transition: opacity 400ms linear, transform 400ms linear !important; }
        .motion-short { transition: opacity 45ms linear, transform 45ms linear !important; }
        .motion-drawer { transition: opacity 120ms linear, transform 120ms linear !important; }
        .motion-drawer[data-side="right"][data-state="open"] { opacity: 1; transform: translateX(0) rotate(0); }
        .motion-drawer[data-side="right"][data-state="closed"] { opacity: 0; transform: translateX(24px) rotate(1deg); }
      `,
    });
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.click();
    const menu = page.locator(".combric-dropdown-menu__content");
    await expect(menu).toHaveAttribute("data-presence", "entered");
    await finishCurrentTransitions(menu);
    await menu.evaluate((element) => element.classList.add("motion-long"));
    await expect(menu).toHaveCSS("transition-duration", /400ms|0\.4s/);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("data-state", "closed");
    await expect
      .poll(() =>
        menu.evaluate((element) =>
          element
            .getAnimations()
            .some((animation) => animation.playState === "running"),
        ),
      )
      .toBe(true);
    const duration = await menu.evaluate((element) =>
      Math.max(
        ...element
          .getAnimations()
          .map((animation) => {
            const endTime = animation.effect?.getComputedTiming().endTime;
            return typeof endTime === "number" && Number.isFinite(endTime)
              ? endTime
              : 0;
          }),
      ),
    );
    expect(duration).toBeGreaterThanOrEqual(400);
    await trigger.click();
    await expect(menu).toHaveAttribute("data-state", "open");
    await expect(menu).toHaveAttribute("data-presence", "entered");
    await finishCurrentTransitions(menu);
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("data-state", "closed");
    await menu.evaluate(async (element) => {
      const transitions = element.getAnimations();
      if (transitions.length === 0) {
        throw new Error("The custom 400ms exit must create CSS transitions");
      }
      await Promise.all(transitions.map((animation) => animation.finished));
    });
    await expect(menu).toHaveCount(0);

    await page.goto("/components/overlays/dropdown-menu/");
    await page.addStyleTag({
      content:
        ".motion-short { transition: opacity 45ms linear, transform 45ms linear !important; }",
    });
    const shortTrigger = page.getByRole("button", { name: "Actions" });
    await shortTrigger.click();
    const shortMenu = page.locator(".combric-dropdown-menu__content");
    await expect(shortMenu).toHaveAttribute("data-presence", "entered");
    await finishCurrentTransitions(shortMenu);
    await shortMenu.evaluate((element) =>
      element.classList.add("motion-short"),
    );
    await expect(shortMenu).toHaveCSS("transition-duration", /45ms|0\.045s/);
    await page.keyboard.press("Escape");
    await expect(shortMenu).toHaveCount(0);

    await page.goto("/components/overlays/drawer/");
    await page.addStyleTag({
      content: `
        .motion-drawer { transition: opacity 120ms linear, transform 120ms linear !important; }
        .motion-drawer[data-side="right"][data-state="open"] { opacity: 1; transform: translateX(0) rotate(0); }
        .motion-drawer[data-side="right"][data-state="closed"] { opacity: 0; transform: translateX(24px) rotate(1deg); }
      `,
    });
    await page.getByRole("button", { name: "Filters" }).click();
    const drawer = page.locator('.combric-drawer__content[data-side="right"]');
    await drawer.evaluate((element) => element.classList.add("motion-drawer"));
    await expect(drawer).toHaveCSS(
      "transition-duration",
      /120ms, 120ms|0\.12s, 0\.12s/,
    );
    await finishCurrentTransitions(drawer);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("data-state", "closed");
    await expect(drawer).toHaveCount(0);
  });

  test("reduced motion removes decorative transitions and promptly cleans overlays", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({
      content:
        ":root { --combric-motion-duration-micro: 400ms; --combric-motion-duration-normal: 400ms; }",
    });
    const routes = [
      [
        "/components/disclosure/accordion/",
        "Details",
        ".combric-accordion__content",
      ],
      [
        "/components/disclosure/collapsible/",
        "Technical details",
        ".combric-collapsible__content",
      ],
      [
        "/components/overlays/dialog/",
        "Open dialog",
        ".combric-dialog__content",
      ],
      ["/components/overlays/drawer/", "Filters", ".combric-drawer__content"],
      [
        "/components/overlays/dropdown-menu/",
        "Actions",
        ".combric-dropdown-menu__content",
      ],
      ["/components/overlays/popover/", "Details", ".combric-popover__content"],
    ] as const;

    for (const [route, triggerName, contentSelector] of routes) {
      await page.goto(route);
      const trigger = page.getByRole("button", { name: triggerName });
      const disclosure = route.includes("/disclosure/");
      if (
        disclosure &&
        (await trigger.getAttribute("aria-expanded")) === "false"
      ) {
        await trigger.click();
      } else if (!disclosure) {
        await trigger.click();
      }
      const content = page.locator(contentSelector).first();
      await expect(content).toHaveAttribute("data-state", "open");
      await expectNoTransition(content);
      if (disclosure) {
        await trigger.click();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await expect(content).toBeHidden();
      } else {
        await page.keyboard.press("Escape");
        await expect(content).toHaveCount(0);
      }
    }

    await page.goto("/components/overlays/tooltip/");
    const tooltipTrigger = page.getByRole("button", { name: "Help" });
    await tooltipTrigger.focus();
    const tooltip = page.locator(".combric-tooltip__content");
    await expectNoTransition(tooltip);
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);

    await page.goto("/components/feedback/toast/");
    const toast = page
      .getByText("Saved", { exact: true })
      .locator("xpath=ancestor::li");
    await expectNoTransition(toast);
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(toast).toHaveCount(0);

    await page.goto("/components/forms/switch/");
    await expectNoTransition(
      page.getByRole("switch", { name: "Notifications" }),
    );
    await page.goto("/components/navigation/tabs/");
    await expectNoTransition(page.getByRole("tab", { name: "Overview" }));
    await page.goto("/components/feedback/spinner/");
    await expect(page.locator(".combric-spinner")).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.goto("/components/feedback/skeleton/");
    await expect(page.locator(".combric-skeleton")).toHaveCSS(
      "animation-name",
      "none",
    );
  });
});

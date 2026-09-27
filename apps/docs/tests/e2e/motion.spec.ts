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
    await page.keyboard.press("Escape");
    await expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    await menuTrigger.click();
    await expect(menu).toHaveAttribute("data-state", "open");
    await menu.dispatchEvent("transitionend", {
      bubbles: true,
      propertyName: "opacity",
    });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("data-state", "open");

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

  test("reduced motion removes decorative transitions and promptly cleans overlays", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
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

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const routes = [
  ["Accordion", "/components/disclosure/accordion/"],
  ["Checkbox", "/components/forms/checkbox/"],
  ["RadioGroup", "/components/forms/radio-group/"],
  ["Switch", "/components/forms/switch/"],
  ["Slider", "/components/forms/slider/"],
  ["Select", "/components/forms/select/"],
  ["Tabs", "/components/navigation/tabs/"],
  ["Dialog", "/components/overlays/dialog/"],
  ["Drawer / Sheet", "/components/overlays/drawer/"],
  ["DropdownMenu", "/components/overlays/dropdown-menu/"],
  ["Popover", "/components/overlays/popover/"],
  ["Tooltip", "/components/overlays/tooltip/"],
  ["Toast", "/components/feedback/toast/"],
  ["Toggle", "/components/actions/toggle/"],
  ["ToggleGroup", "/components/actions/toggle-group/"],
] as const;

async function exercise(page: Page, family: string): Promise<void> {
  switch (family) {
    case "Accordion": {
      const trigger = page.getByRole("button", { name: "Details" });
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await trigger.press("Enter");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      break;
    }
    case "Checkbox": {
      const control = page.getByRole("checkbox", {
        name: "Include archived projects",
      });
      await expect(control).toBeChecked();
      await control.focus();
      await control.press("Space");
      await expect(control).not.toBeChecked();
      break;
    }
    case "RadioGroup": {
      const starter = page.getByRole("radio", { name: "Starter" });
      const pro = page.getByRole("radio", { name: "Pro" });
      await expect(starter).toBeChecked();
      await pro.click();
      await expect(pro).toBeChecked();
      await expect(starter).not.toBeChecked();
      break;
    }
    case "Switch": {
      const control = page.getByRole("switch", { name: "Notifications" });
      await expect(control).toBeChecked();
      await control.focus();
      await control.press("Space");
      await expect(control).not.toBeChecked();
      break;
    }
    case "Slider": {
      const control = page.getByRole("slider", { name: "Volume" });
      await expect(control).toHaveValue("50");
      await control.focus();
      await control.press("ArrowRight");
      await expect(control).toHaveValue("51");
      break;
    }
    case "Select": {
      const control = page.getByRole("combobox", { name: "Region" });
      await expect(control).toHaveValue("eu");
      await control.selectOption("us");
      await expect(control).toHaveValue("us");
      break;
    }
    case "Tabs": {
      const overview = page.getByRole("tab", { name: "Overview" });
      const activity = page.getByRole("tab", { name: "Activity" });
      await expect(overview).toHaveAttribute("aria-selected", "true");
      await overview.focus();
      await overview.press("ArrowRight");
      await expect(activity).toBeFocused();
      await expect(activity).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("tabpanel", { name: "Activity" }),
      ).toBeVisible();
      break;
    }
    case "Dialog":
    case "Drawer / Sheet": {
      const trigger = page.getByRole("button", {
        name: family === "Dialog" ? "Open dialog" : "Filters",
      });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(dialog).toBeVisible();
      break;
    }
    case "DropdownMenu": {
      const trigger = page.getByRole("button", { name: "Actions" });
      await trigger.click();
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Archive" }),
      ).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      break;
    }
    case "Popover": {
      const trigger = page.getByRole("button", { name: "Details" });
      await trigger.click();
      await expect(
        page.getByText("Non-modal details", { exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByText("Non-modal details", { exact: true }),
      ).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      break;
    }
    case "Tooltip": {
      const trigger = page.getByRole("button", { name: "Help" });
      await trigger.focus();
      await expect(page.getByRole("tooltip")).toBeVisible();
      break;
    }
    case "Toast": {
      await expect(
        page.getByRole("list", { name: "Notifications" }),
      ).toBeVisible();
      await expect(page.getByText("Saved", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Dismiss" }).click();
      await expect(page.getByText("Saved", { exact: true })).toBeHidden();
      break;
    }
    case "Toggle": {
      const control = page.getByRole("button", { name: "Pin project" });
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await control.press("Space");
      await expect(control).toHaveAttribute("aria-pressed", "false");
      break;
    }
    case "ToggleGroup": {
      const list = page.getByRole("button", { name: "List" });
      const grid = page.getByRole("button", { name: "Grid" });
      await expect(list).toHaveAttribute("aria-pressed", "true");
      await list.focus();
      await list.press("ArrowRight");
      await expect(grid).toBeFocused();
      await expect(grid).toHaveAttribute("aria-pressed", "false");
      await grid.press("Space");
      await expect(grid).toHaveAttribute("aria-pressed", "true");
      break;
    }
  }
}

test.describe("catalogue accessibility regression matrix", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "Desktop keyboard matrix; mobile navigation is covered separately.",
  );

  for (const [family, route] of routes) {
    test(`${family}: real example, behavior and axe`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator(".combric-docs-example")).toBeVisible();
      await exercise(page, family);
      const builder = new AxeBuilder({ page });
      if (["DropdownMenu", "Popover", "Tooltip", "Toast"].includes(family)) {
        // Non-modal portals intentionally live outside the docs page landmarks.
        // The docs shell's landmark coverage is tested on ordinary pages.
        builder.disableRules(["region"]);
      }
      const result = await builder.analyze();
      expect(result.violations).toEqual([]);
    });
  }
});

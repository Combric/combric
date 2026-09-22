import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectNoAxeViolations(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
}

test("desktop navigation and ordinary component documentation work", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Combric" }),
  ).toBeVisible();
  await page.goto("/components/actions/button/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Button" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save changes" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy example code" }).click();
  await expect(page.getByRole("status")).toHaveText("Copied.");
  await expectNoAxeViolations(page);
});

test("dialog keyboard dismissal restores focus", async ({ page }) => {
  await page.goto("/components/overlays/dialog/");
  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Color Map exposes canonical and derived data", async ({ page }) => {
  await page.goto("/foundations/colors/");
  await expect(
    page.getByRole("heading", { name: "Primitive palette" }),
  ).toBeVisible();
  await expect(
    page.getByText("color.blue.600", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Derived OKLCH", { exact: true })).toBeVisible();
  await expect(
    page.getByText("color.accent.hover", { exact: true }).first(),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("Playground controls update code and viewport", async ({ page }) => {
  await page.goto("/playground/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Playground" }),
  ).toBeVisible();
  await page.getByLabel("Component family").selectOption("alert");
  await page.getByLabel("Tone").selectOption("error");
  await page.getByLabel("Title").fill("Import failed");
  await expect(page.getByText('tone="error"', { exact: false })).toBeVisible();
  const viewport = page.getByRole("group", { name: "Preview viewport" });
  await viewport.getByText("mobile", { exact: true }).click();
  await expect(viewport.getByLabel("mobile")).toBeChecked();
  const frame = page.getByTitle("Alert preview");
  await expect(frame).toHaveCSS("width", "384px");
  await expect(frame.contentFrame().getByText("Import failed")).toBeVisible();
  await page.getByRole("button", { name: "Reset Playground" }).click();
  await expect(page.getByLabel("desktop")).toBeChecked();
  await expectNoAxeViolations(page);
});

test("unknown routes use the accessible 404 page", async ({ page }) => {
  const response = await page.goto("/not-a-real-combric-route/");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
});

test.describe("mobile documentation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile project only");

  test("mobile navigation opens and remains accessible", async ({ page }) => {
    await page.goto("/getting-started/");
    const menu = page.getByRole("button", { name: /menu/i }).first();
    await menu.click();
    await expect(
      page.getByRole("link", { name: "Installation", exact: true }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

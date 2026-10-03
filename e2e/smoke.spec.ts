import { expect, test } from "@playwright/test";

test("home page loads with brand heading and Vietnamese title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Tuấn Linh Coffee/);
  await expect(page.getByRole("heading", { level: 1, name: "Tuấn Linh Coffee" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});

test("brand fonts are applied", async ({ page }) => {
  await page.goto("/");

  const headingFont = await page
    .getByRole("heading", { level: 1 })
    .evaluate((el) => getComputedStyle(el).fontFamily);
  const bodyFont = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);

  expect(headingFont).toContain("Lora");
  expect(bodyFont).toContain("Be Vietnam Pro");
});

test("no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

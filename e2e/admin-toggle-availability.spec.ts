import { expect, test } from "@playwright/test";

test.describe("E2E #4: Admin bật/tắt hết hàng một chạm (Checkpoint 4, A3)", () => {
  test("admin toggles product out-of-stock; customer sees item unavailable", async ({
    page,
    browser,
  }) => {
    // 1. Admin logs in
    await page.goto("/admin/dang-nhap");
    await expect(page.getByRole("heading", { name: /Đăng Nhập Quản Trị/i })).toBeVisible();

    await page.locator("#login-email").fill("admin@tuanlinh.coffee");
    await page.locator("#login-password").fill("admin123456");
    await page.getByRole("button", { name: /Đăng Nhập Hệ Thống/i }).click();

    await expect(page).toHaveURL(/\/admin\/don-hang/);

    // 2. Admin navigates to /admin/mon
    await page.goto("/admin/mon");
    await expect(page.getByRole("heading", { name: /Quản lý thực đơn/i })).toBeVisible();

    // Find the first row in the menu table
    const firstRow = page.locator("#menu-table-body tr").first();
    await expect(firstRow).toBeVisible();

    const productName = await firstRow.locator("td").first().locator(".font-semibold").innerText();
    expect(productName).toBeTruthy();

    // Toggle availability switch
    const switchLabel = firstRow.locator("label.switch");
    await switchLabel.click();

    // Verify status changed to "Hết hàng"
    await expect(firstRow.getByText("Hết hàng")).toBeVisible({ timeout: 5000 });

    // 3. Customer views menu on homepage
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await customerPage.goto("/");

    const customerCard = customerPage.locator("article").filter({ hasText: productName }).first();
    await expect(customerCard).toBeVisible();
    await expect(customerCard.getByText("Hết hàng")).toBeVisible();

    // Clicking an out-of-stock card should NOT open dialog
    await customerCard.click();
    await expect(customerPage.getByRole("dialog")).not.toBeVisible();

    // 4. Admin toggles back to "Còn hàng"
    await switchLabel.click();
    await expect(firstRow.getByText("Còn hàng")).toBeVisible({ timeout: 5000 });

    // Customer reloads and sees item available again
    await customerPage.reload();
    const restoredCard = customerPage.locator("article").filter({ hasText: productName }).first();
    await expect(restoredCard).toBeVisible();
    await expect(restoredCard.getByText("Hết hàng")).not.toBeVisible();

    // Clicking available card opens options sheet
    await restoredCard.click();
    await expect(customerPage.getByRole("dialog")).toBeVisible();

    await customerContext.close();
  });
});

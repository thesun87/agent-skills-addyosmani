import { expect, test } from "@playwright/test";

test.describe("E2E #3: Admin xử lý đơn (Checkpoint 3, A1, A4, A5, A6)", () => {
  test.beforeEach(async ({ context }) => {
    const randomIp = `10.3.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    await context.setExtraHTTPHeaders({
      "x-forwarded-for": randomIp,
    });
  });

  test("customer places order, admin logs in, processes order, and customer sees update", async ({
    page,
    browser,
  }) => {
    // 1. Customer places order
    await page.goto("/");
    const productCard = page
      .locator("article")
      .filter({ hasText: /Cà phê/i })
      .first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    await sheet.getByRole("button", { name: /^M$/i }).click();
    await sheet.getByRole("button", { name: "100%" }).click();
    await sheet.getByRole("button", { name: "Đá vừa" }).click();

    const addToCartBtn = sheet.getByRole("button", { name: /Thêm vào giỏ/i });
    await addToCartBtn.click();

    const checkoutLink = page.getByRole("link", { name: /Tiến hành thanh toán/i });
    await checkoutLink.click();
    await expect(page).toHaveURL(/\/thanh-toan/);

    await page.getByLabel(/Họ và tên/i).fill("Khách E2E Test");
    await page.getByLabel(/Số điện thoại/i).fill("0988776655");
    await page.getByLabel(/Địa chỉ giao hàng/i).fill("100 Hoàng Hoa Thám, Ba Đình");
    await page.locator('input[value="COD"]').check();

    const submitBtn = page.getByRole("button", { name: /Đặt hàng ngay/i });
    await submitBtn.click();

    await expect(page).toHaveURL(/\/don-hang\/(CF-\d{6}-[A-Z0-9]{4})/, { timeout: 15000 });
    const url = page.url();
    const match = url.match(/(CF-\d{6}-[A-Z0-9]{4})/);
    expect(match).not.toBeNull();
    const orderCode = match ? match[1] : "";

    // Customer initially sees PENDING
    await expect(page.getByText(/Chờ quán duyệt/i)).toBeVisible();

    // 2. Admin context
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/admin/dang-nhap");
    await expect(adminPage.getByRole("heading", { name: /Đăng Nhập Quản Trị/i })).toBeVisible();

    await adminPage.locator("#login-email").fill("admin@tuanlinh.coffee");
    await adminPage.locator("#login-password").fill("Admin123!@");
    await adminPage.locator("#btn-submit-login").click();

    // Redirects to /admin/don-hang
    await expect(adminPage).toHaveURL(/\/admin\/don-hang/, { timeout: 15000 });
    await expect(adminPage.locator("#page-heading")).toContainText("Quản lý đơn hàng");

    // 3. Admin finds and selects the new order
    const orderCardLocator = adminPage.locator(".order-card").filter({ hasText: orderCode });
    await expect(orderCardLocator).toBeVisible({ timeout: 10000 });
    await orderCardLocator.click();

    // 4. Admin advances state: PENDING -> CONFIRMED
    const confirmBtn = adminPage.getByRole("button", { name: /Tiếp nhận đơn/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Admin advances state: CONFIRMED -> PREPARING
    const prepareBtn = adminPage.getByRole("button", { name: /Bắt đầu pha chế/i });
    await expect(prepareBtn).toBeVisible({ timeout: 10000 });
    await prepareBtn.click();

    // 6. Verify in admin that state is PREPARING (Đang pha chế)
    await expect(adminPage.locator("#order-detail-pane")).toContainText("Đang pha chế");

    // 7. Customer tracking page reloads or reflects the update
    await page.reload();
    await expect(page.getByText(/Đang pha chế/i)).toBeVisible({ timeout: 10000 });

    await adminContext.close();
  });
});

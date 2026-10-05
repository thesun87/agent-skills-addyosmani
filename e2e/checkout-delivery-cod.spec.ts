import { expect, test } from "@playwright/test";

test.describe("E2E #1: Đặt giao hàng COD (Success Criteria #1)", () => {
  test.beforeEach(async ({ context }) => {
    const randomIp = `10.1.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    await context.setExtraHTTPHeaders({
      "x-forwarded-for": randomIp,
    });
  });

  test("complete customer order flow in <= 4 steps on mobile and desktop", async ({ page }) => {
    // 1. Visit menu
    await page.goto("/");
    await expect(page).toHaveTitle(/Tuấn Linh Coffee/);

    // 2. Select first available product
    const productCard = page
      .locator("article")
      .filter({ hasText: /Cà phê/i })
      .first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    // 3. Option sheet opens, choose required options and add to cart
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Select required options: Size (M), Đường (100%), Đá (Đá vừa)
    await sheet.getByRole("button", { name: /Size M|^M$/i }).click();
    await sheet.getByRole("button", { name: /100% đường|100%/i }).click();
    await sheet.getByRole("button", { name: /Đá vừa/i }).click();

    const addToCartBtn = sheet.getByRole("button", { name: /Thêm vào giỏ/i });
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();

    // 4. Cart drawer opens, proceed to checkout
    const checkoutLink = page.getByRole("link", { name: /Tiến hành thanh toán/i });
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();

    await expect(page).toHaveURL(/\/thanh-toan/);

    // 5. Fill delivery form
    await page.getByLabel(/Họ và tên/i).fill("Nguyễn Văn Tuấn");
    await page.getByLabel(/Số điện thoại/i).fill("0987654321");
    await page.getByLabel(/Địa chỉ giao hàng/i).fill("123 Lê Lợi, Phường Bến Nghé, Quận 1");

    // Select COD payment method
    await page.locator('input[value="COD"]').check();

    // 6. Submit order
    const submitBtn = page.getByRole("button", { name: /Đặt hàng ngay/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. Verify redirect to tracking page
    await expect(page).toHaveURL(/\/don-hang\/CF-\d{6}-[A-Z0-9]{4}/, { timeout: 15000 });

    // Verify tracking page details
    await expect(page.getByRole("heading", { name: /CF-\d{6}-[A-Z0-9]{4}/ })).toBeVisible();
    await expect(page.getByText(/Trạng thái đơn hàng/i)).toBeVisible();
    await expect(page.getByText(/Chờ quán duyệt/i)).toBeVisible();
    await expect(page.getByText(/Giao tận nơi/i)).toBeVisible();
    await expect(page.getByText(/123 Lê Lợi/i)).toBeVisible();
  });
});

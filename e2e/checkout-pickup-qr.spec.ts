import { expect, test } from "@playwright/test";

test.describe("E2E #2: Đặt pickup + chuyển khoản VietQR (Success Criteria #5)", () => {
  test.beforeEach(async ({ context }) => {
    const randomIp = `10.2.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    await context.setExtraHTTPHeaders({
      "x-forwarded-for": randomIp,
    });
  });

  test("complete pickup order with VietQR payment on mobile and desktop", async ({ page }) => {
    // 1. Visit menu
    await page.goto("/");

    // 2. Select product and add to cart
    const productCard = page
      .locator("article")
      .filter({ hasText: /Cà phê/i })
      .first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Select required options: Size (M), Đường (100%), Đá (Đá vừa)
    await sheet.getByRole("button", { name: /^M$/i }).click();
    await sheet.getByRole("button", { name: "100%" }).click();
    await sheet.getByRole("button", { name: "Đá vừa" }).click();

    const addToCartBtn = sheet.getByRole("button", { name: /Thêm vào giỏ/i });
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();

    // 3. Proceed to checkout
    const checkoutLink = page.getByRole("link", { name: /Tiến hành thanh toán/i });
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();

    await expect(page).toHaveURL(/\/thanh-toan/);

    // 4. Switch to PICKUP tab
    const pickupTab = page.getByRole("tab", { name: /Lấy tại quán/i });
    await pickupTab.click();

    // 5. Fill customer details
    await page.getByLabel(/Họ và tên/i).fill("Lê Thị Linh");
    await page.getByLabel(/Số điện thoại/i).fill("0912345678");

    // Select VietQR payment method
    await page.locator('input[value="BANK_TRANSFER"]').check();

    // 6. Submit order
    const submitBtn = page.getByRole("button", { name: /Đặt hàng ngay/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. Verify redirect to tracking page
    await expect(page).toHaveURL(/\/don-hang\/CF-\d{6}-[A-Z0-9]{4}/, { timeout: 15000 });

    // 8. Verify VietQR panel is rendered with valid QR image and bank details
    await expect(page.getByText(/Thanh toán chuyển khoản VietQR/i)).toBeVisible();
    const qrImage = page.locator('img[alt*="VietQR"]');
    await expect(qrImage).toBeVisible();

    const qrSrc = await qrImage.getAttribute("src");
    expect(qrSrc).toContain("img.vietqr.io");
    expect(qrSrc).toContain("amount=");

    // Verify copy pills and timeline
    await expect(page.getByText(/CHỜ THANH TOÁN/i)).toBeVisible();
    await expect(page.getByText(/Lấy tại quán/i)).toBeVisible();
    await expect(page.getByText(/Sẵn sàng lấy món/i)).toBeVisible();
  });
});

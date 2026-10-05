import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BREAKPOINTS = [
  { name: "320px (Small Mobile)", width: 320, height: 640 },
  { name: "375px (Standard Mobile)", width: 375, height: 812 },
  { name: "768px (Tablet)", width: 768, height: 1024 },
  { name: "1024px (Laptop)", width: 1024, height: 768 },
  { name: "1440px (Desktop)", width: 1440, height: 900 },
];

test.describe("T19: Accessibility & Responsive Audits", () => {
  test.beforeEach(async ({ context }) => {
    const randomIp = `10.5.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    await context.setExtraHTTPHeaders({
      "x-forwarded-for": randomIp,
    });
  });

  test("Trang Menu: Axe scan 0 lỗi serious/critical & không cuộn ngang", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // 1. Accessibility Scan
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const severeViolations = axeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(severeViolations, JSON.stringify(severeViolations, null, 2)).toEqual([]);

    // 2. Responsive Breakpoints: No Horizontal Overflow
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(100);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `Horizontal overflow detected at ${bp.name}`).toBeLessThanOrEqual(1);
    }
  });

  test("Trang Checkout: Axe scan 0 lỗi serious/critical & không cuộn ngang", async ({ page }) => {
    // Add item first to have checkout form visible
    await page.goto("/");
    const productCard = page.locator("article").first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Pick required options: Size M, Đường, Đá
    const sizeBtn = sheet.getByRole("button", { name: /Size M|^M$/i });
    if (await sizeBtn.isVisible()) await sizeBtn.click();
    const sugarBtn = sheet.getByRole("button", { name: /100% đường|100%/i });
    if (await sugarBtn.isVisible()) await sugarBtn.click();
    const iceBtn = sheet.getByRole("button", { name: /Đá vừa/i });
    if (await iceBtn.isVisible()) await iceBtn.click();

    await sheet.getByRole("button", { name: /Thêm vào giỏ|Thêm ngay/i }).click();

    await page.goto("/thanh-toan");
    await expect(page.getByRole("heading", { name: /Thông tin giao hàng|Thanh toán/i })).toBeVisible();

    // 1. Accessibility Scan
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const severeViolations = axeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(severeViolations, JSON.stringify(severeViolations, null, 2)).toEqual([]);

    // 2. Responsive Breakpoints
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(100);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `Horizontal overflow on checkout at ${bp.name}`).toBeLessThanOrEqual(1);
    }
  });

  test("Trang Theo dõi đơn & Admin đơn hàng: Axe scan 0 lỗi serious/critical", async ({
    page,
    browser,
  }) => {
    // 1. Place order to get tracking page
    await page.goto("/");
    const productCard = page.locator("article").first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    const mBtn = sheet.getByRole("button", { name: /Size M|^M$/i });
    if (await mBtn.isVisible()) await mBtn.click();
    const sugarBtn = sheet.getByRole("button", { name: /100% đường|100%/i });
    if (await sugarBtn.isVisible()) await sugarBtn.click();
    const iceBtn = sheet.getByRole("button", { name: /Đá vừa/i });
    if (await iceBtn.isVisible()) await iceBtn.click();

    const addBtn = sheet.getByRole("button", { name: /Thêm vào giỏ|Thêm ngay/i });
    await expect(addBtn).toBeEnabled();
    await addBtn.click();

    const checkoutLink = page.getByRole("link", { name: /Tiến hành thanh toán/i });
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();
    await expect(page).toHaveURL(/\/thanh-toan/);
    await page.getByLabel(/Họ và tên/i).fill("Test A11y Khách");
    await page.getByLabel(/Số điện thoại/i).fill("0912345678");
    await page.getByLabel(/Địa chỉ giao hàng/i).fill("50 Hai Bà Trưng, Quận 1");
    await page.locator('input[value="COD"]').check();

    const submitBtn = page.getByRole("button", { name: /Đặt hàng ngay/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await expect(page).toHaveURL(/\/don-hang\/(CF-\d{6}-[A-Z0-9]{4})/, { timeout: 15000 });

    // 2. Tracking Page A11y & Breakpoints
    const trackingAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const severeTracking = trackingAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(severeTracking, JSON.stringify(severeTracking, null, 2)).toEqual([]);

    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(50);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `Overflow on tracking page at ${bp.name}`).toBeLessThanOrEqual(1);
    }

    // 3. Admin Workspace A11y
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/admin/dang-nhap");
    await adminPage.locator("#login-email").fill("admin@tuanlinh.coffee");
    await adminPage.locator("#login-password").fill("Admin123!@");
    await adminPage.locator("#btn-submit-login").click();

    await expect(adminPage).toHaveURL(/\/admin\/don-hang/, { timeout: 15000 });

    const adminAxe = await new AxeBuilder({ page: adminPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const severeAdmin = adminAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(severeAdmin, JSON.stringify(severeAdmin, null, 2)).toEqual([]);

    await adminContext.close();
  });

  test("Core Web Vitals trên Mobile (LCP < 2.5s, CLS < 0.1)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const vitals = await page.evaluate(async () => {
      return new Promise<{ lcp: number; cls: number; fcp: number }>((resolve) => {
        let lcp = 0;
        let cls = 0;
        let fcp = 0;

        try {
          const poLcp = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              lcp = entries[entries.length - 1].startTime;
            }
          });
          poLcp.observe({ type: "largest-contentful-paint", buffered: true });
        } catch {}

        try {
          interface LayoutShiftEntry extends PerformanceEntry {
            value: number;
            hadRecentInput: boolean;
          }
          const poCls = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries() as unknown as LayoutShiftEntry[]) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
          });
          poCls.observe({ type: "layout-shift", buffered: true });
        } catch {}

        try {
          const poPaint = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.name === "first-contentful-paint") {
                fcp = entry.startTime;
              }
            }
          });
          poPaint.observe({ type: "paint", buffered: true });
        } catch {}

        setTimeout(() => {
          resolve({ lcp, cls, fcp });
        }, 1500);
      });
    });

    expect(vitals.lcp).toBeLessThan(2500);
    expect(vitals.cls).toBeLessThan(0.1);
  });
});

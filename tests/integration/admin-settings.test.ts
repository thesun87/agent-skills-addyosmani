import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "./helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import { updateShopSettingsAction } from "@/features/settings/actions";
import { getShopSettings, isShopOpen } from "@/features/settings/queries";
import { calculateTotals } from "@/lib/pricing";

// Mock requireAdmin to return seeded admin
vi.mock("@/features/auth/require-admin", () => ({
  requireAdmin: vi.fn(async () => {
    const admin = await db.adminUser.findFirst();
    if (!admin) throw new Error("No admin");
    return { id: admin.id, email: admin.email, name: admin.name };
  }),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Admin Shop Settings (T16, A7)", () => {
  beforeEach(async () => {
    await resetDb();
    await seedAdminUser();
  });

  it("updates shop settings and persists to database", async () => {
    const res = await updateShopSettingsAction({
      shopName: "Tuấn Linh Coffee Quán Sứ",
      address: "45 Quán Sứ, Hoàn Kiếm, Hà Nội",
      phone: "0901112233",
      openTime: "06:30",
      closeTime: "22:30",
      deliveryRadiusKm: 7,
      shippingFee: 18000,
      freeShippingThreshold: 200000,
      bankBin: "970436",
      bankAccountNo: "1234567890",
      bankAccountName: "NGUYEN TUAN LINH",
    });

    expect(res.success).toBe(true);
    expect(res.settings?.shopName).toBe("Tuấn Linh Coffee Quán Sứ");

    const settings = await getShopSettings();
    expect(settings.shopName).toBe("Tuấn Linh Coffee Quán Sứ");
    expect(settings.openTime).toBe("06:30");
    expect(settings.closeTime).toBe("22:30");
    expect(settings.shippingFee).toBe(18000);
    expect(settings.freeShippingThreshold).toBe(200000);
    expect(settings.bankBin).toBe("970436");
  });

  it("rejects closeTime <= openTime with Vietnamese error", async () => {
    const res = await updateShopSettingsAction({
      shopName: "Tuấn Linh Coffee",
      address: "123 Đường Cà Phê",
      phone: "0987654321",
      openTime: "22:00",
      closeTime: "07:00",
      deliveryRadiusKm: 5,
      shippingFee: 15000,
      freeShippingThreshold: 150000,
      bankBin: "970422",
      bankAccountNo: "0987654321",
      bankAccountName: "TUAN LINH",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Giờ đóng cửa phải sau giờ mở cửa.");
  });

  it("rejects negative shipping fee or threshold", async () => {
    const res = await updateShopSettingsAction({
      shopName: "Tuấn Linh Coffee",
      address: "123 Đường Cà Phê",
      phone: "0987654321",
      openTime: "07:00",
      closeTime: "22:00",
      deliveryRadiusKm: 5,
      shippingFee: -1000,
      freeShippingThreshold: 150000,
      bankBin: "970422",
      bankAccountNo: "0987654321",
      bankAccountName: "TUAN LINH",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("updating shipping fee reflects immediately in calculateTotals", async () => {
    await updateShopSettingsAction({
      shopName: "Tuấn Linh Coffee",
      address: "123 Đường Cà Phê",
      phone: "0987654321",
      openTime: "07:00",
      closeTime: "22:00",
      deliveryRadiusKm: 5,
      shippingFee: 20000,
      freeShippingThreshold: 100000,
      bankBin: "970422",
      bankAccountNo: "0987654321",
      bankAccountName: "TUAN LINH",
    });

    const settings = await getShopSettings();
    const totalsUnderThreshold = calculateTotals(
      [{ unitPrice: 50000, quantity: 1 }],
      "DELIVERY",
      settings
    );
    expect(totalsUnderThreshold.shippingFee).toBe(20000);
    expect(totalsUnderThreshold.total).toBe(70000);

    const totalsOverThreshold = calculateTotals(
      [{ unitPrice: 120000, quantity: 1 }],
      "DELIVERY",
      settings
    );
    expect(totalsOverThreshold.shippingFee).toBe(0);
    expect(totalsOverThreshold.total).toBe(120000);
  });

  it("updating open/close hours immediately reflects in isShopOpen", async () => {
    await updateShopSettingsAction({
      shopName: "Tuấn Linh Coffee",
      address: "123 Đường Cà Phê",
      phone: "0987654321",
      openTime: "08:00",
      closeTime: "18:00",
      deliveryRadiusKm: 5,
      shippingFee: 15000,
      freeShippingThreshold: 150000,
      bankBin: "970422",
      bankAccountNo: "0987654321",
      bankAccountName: "TUAN LINH",
    });

    const settings = await getShopSettings();

    // 07:30 VN time (UTC 00:30) -> closed
    const dateAt730Vn = new Date(Date.UTC(2026, 9, 4, 0, 30));
    expect(isShopOpen(settings, dateAt730Vn)).toBe(false);

    // 09:00 VN time (UTC 02:00) -> open
    const dateAt900Vn = new Date(Date.UTC(2026, 9, 4, 2, 0));
    expect(isShopOpen(settings, dateAt900Vn)).toBe(true);

    // 18:30 VN time (UTC 11:30) -> closed
    const dateAt1830Vn = new Date(Date.UTC(2026, 9, 4, 11, 30));
    expect(isShopOpen(settings, dateAt1830Vn)).toBe(false);
  });
});

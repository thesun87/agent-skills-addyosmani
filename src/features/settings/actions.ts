"use server";

import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import { revalidatePath } from "next/cache";
import { type ShopSettings, shopSettingsSchema } from "./schema";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  settings?: T;
}

export async function updateShopSettingsAction(
  input: Partial<ShopSettings>
): Promise<ActionResult<ShopSettings>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const current = await db.shopSettings.findUnique({
    where: { id: "default" },
  });

  const merged = {
    id: "default",
    shopName: input.shopName ?? current?.shopName ?? "Tuấn Linh Coffee",
    address: input.address ?? current?.address ?? "Số 120 Hoàng Hoa Thám, Ba Đình, Hà Nội",
    phone: input.phone ?? current?.phone ?? "0912 345 678",
    openTime: input.openTime ?? current?.openTime ?? "07:00",
    closeTime: input.closeTime ?? current?.closeTime ?? "22:00",
    deliveryRadiusKm: input.deliveryRadiusKm ?? current?.deliveryRadiusKm ?? 5,
    shippingFee: input.shippingFee ?? current?.shippingFee ?? 15000,
    freeShippingThreshold:
      input.freeShippingThreshold ?? current?.freeShippingThreshold ?? 150000,
    bankBin: input.bankBin ?? current?.bankBin ?? "970436",
    bankAccountNo: input.bankAccountNo ?? current?.bankAccountNo ?? "9988776655",
    bankAccountName: input.bankAccountName ?? current?.bankAccountName ?? "NGUYEN TUAN LINH",
  };

  const parsed = shopSettingsSchema.safeParse(merged);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu cài đặt không hợp lệ." };
  }

  // Validate closeTime > openTime
  if (parsed.data.closeTime <= parsed.data.openTime) {
    return { success: false, error: "Giờ đóng cửa phải sau giờ mở cửa." };
  }

  const updated = await db.shopSettings.upsert({
    where: { id: "default" },
    create: parsed.data,
    update: parsed.data,
  });

  revalidatePath("/admin/cai-dat");
  revalidatePath("/");
  revalidatePath("/(shop)");
  revalidatePath("/thanh-toan");

  return { success: true, settings: updated };
}

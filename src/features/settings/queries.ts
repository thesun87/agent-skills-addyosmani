import { db } from "@/lib/db";
import { isOpenNow, type OpeningHours } from "@/lib/opening-hours";
import { type ShopSettings, shopSettingsSchema } from "./schema";

const DEFAULT_SETTINGS: ShopSettings = {
  id: "default",
  shopName: "Tuấn Linh Coffee",
  address: "123 Đường Cà Phê, Quận 1, TP. HCM",
  phone: "0987654321",
  openTime: "07:00",
  closeTime: "22:00",
  deliveryRadiusKm: 5,
  shippingFee: 15000,
  freeShippingThreshold: 150000,
  bankBin: "970422",
  bankAccountNo: "0987654321",
  bankAccountName: "TUAN LINH COFFEE",
};

export async function getShopSettings(): Promise<ShopSettings> {
  const row = await db.shopSettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    return DEFAULT_SETTINGS;
  }

  const parsed = shopSettingsSchema.safeParse(row);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export function buildWeeklyOpeningHours(openTime: string, closeTime: string): OpeningHours {
  const day = { open: openTime, close: closeTime };
  return {
    0: day,
    1: day,
    2: day,
    3: day,
    4: day,
    5: day,
    6: day,
  };
}

export function isShopOpen(settings: ShopSettings, now: Date = new Date()): boolean {
  const hours = buildWeeklyOpeningHours(settings.openTime, settings.closeTime);
  return isOpenNow(hours, now);
}

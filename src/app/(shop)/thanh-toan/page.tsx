import type { Metadata } from "next";
import { getVisibleMenu } from "@/features/menu/queries";
import { getShopSettings, isShopOpen, buildWeeklyOpeningHours } from "@/features/settings/queries";
import { pickupSlots, formatShopTime } from "@/lib/opening-hours";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Thanh toán | Tuấn Linh Coffee",
  description: "Xác nhận hình thức nhận hàng và thanh toán đơn hàng tại Tuấn Linh Coffee",
};

export default async function CheckoutPage() {
  const [categories, settings] = await Promise.all([getVisibleMenu(), getShopSettings()]);

  const allProducts = categories.flatMap((c) => c.products);
  const now = new Date();
  const isOpen = isShopOpen(settings, now);
  const weeklyHours = buildWeeklyOpeningHours(settings.openTime, settings.closeTime);
  const slots = pickupSlots(weeklyHours, now).map(formatShopTime);

  return (
    <CheckoutForm
      menuProducts={allProducts}
      settings={settings}
      isOpen={isOpen}
      availablePickupSlots={slots}
    />
  );
}

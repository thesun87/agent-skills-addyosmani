import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/features/auth/require-admin";
import { getShopSettings } from "@/features/settings/queries";
import { SettingsManager } from "@/features/settings/components/SettingsManager";

export const metadata: Metadata = {
  title: "Cài Đặt Quán — Tuấn Linh Coffee",
  description: "Cấu hình giờ hoạt động, phí giao hàng, tài khoản thanh toán VietQR",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getShopSettings();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-text-muted">
          Đang tải cài đặt quán...
        </div>
      }
    >
      <SettingsManager initialSettings={settings} />
    </Suspense>
  );
}

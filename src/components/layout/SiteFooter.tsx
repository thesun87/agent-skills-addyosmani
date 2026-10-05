import React from "react";
import type { ShopSettings } from "@/features/settings/schema";
import { BrandLogo } from "@/components/ui/BrandLogo";

export interface SiteFooterProps {
  settings?: Partial<ShopSettings>;
  className?: string;
}

const DEFAULT_FOOTER_SETTINGS: Partial<ShopSettings> = {
  shopName: "Tuấn Linh Coffee",
  address: "123 Đường Cà Phê, Quận 1, TP. HCM",
  phone: "0987.654.321",
  openTime: "07:00",
  closeTime: "22:00",
  deliveryRadiusKm: 5,
};

export function SiteFooter({ settings, className = "" }: SiteFooterProps) {
  const merged = { ...DEFAULT_FOOTER_SETTINGS, ...settings };

  return (
    <footer
      className={`border-t border-[#3e2b24] bg-[#241814] text-[#d8c4b6] ${className}`}
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Column */}
          <div>
            <div className="mb-3">
              <BrandLogo className="brightness-125" />
            </div>
            <p className="text-sm leading-relaxed text-[#b59e91]">
              Cà phê rang mộc pha máy đậm vị truyền thống, nguyên liệu tươi ngon được chọn lọc kỹ
              lưỡng mỗi ngày.
            </p>
          </div>

          {/* Contact / Location Column */}
          <div className="space-y-2 text-sm">
            <h3 className="font-display font-semibold text-[#fbf5ec]">Địa chỉ & Liên hệ</h3>
            <p className="flex items-start gap-2">
              <span className="text-accent shrink-0">📍</span>
              <span>{merged.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-accent shrink-0">📞</span>
              <span>Hotline: {merged.phone}</span>
            </p>
            <p className="flex items-center gap-2 text-xs text-[#a89080]">
              <span>🛵 Bán kính giao hàng: trong vòng {merged.deliveryRadiusKm} km</span>
            </p>
          </div>

          {/* Opening Hours Column */}
          <div className="space-y-2 text-sm">
            <h3 className="font-display font-semibold text-[#fbf5ec]">Giờ phục vụ</h3>
            <p className="flex items-center gap-2">
              <span className="text-accent shrink-0">⏰</span>
              <span>
                Mở cửa: {merged.openTime} - {merged.closeTime}
              </span>
            </p>
            <p className="text-xs text-[#a89080]">Phục vụ tất cả các ngày trong tuần (kể cả lễ, Tết).</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-[#3e2b24]/60 pt-6 text-center text-xs text-[#9c8476]">
          <p>© 2026 {merged.shopName}. Đã đăng ký bản quyền.</p>
        </div>
      </div>
    </footer>
  );
}

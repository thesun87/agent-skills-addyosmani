import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export interface ShopHeaderProps {
  cartCount?: number;
  showStoreBanner?: boolean;
  showPromoStrip?: boolean;
}

export function ShopHeader({
  cartCount = 0,
  showStoreBanner = true,
  showPromoStrip = true,
}: ShopHeaderProps) {
  return (
    <header className="border-border/80 bg-surface-raised sticky top-0 z-40 border-b shadow-xs">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <BrandLogo asHeading={true} />

        <Link
          href="/gio-hang"
          className="border-border/80 bg-surface text-text hover:border-text/20 relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-[#f3e8d8]"
          aria-label={`Giỏ hàng, hiện có ${cartCount} món`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="hidden sm:inline">Giỏ hàng</span>
          {cartCount > 0 ? (
            <span className="bg-primary flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
      </div>

      {showStoreBanner ? (
        <div className="border-border/40 border-t bg-gradient-to-r from-[#442a22] to-[#2f1d17] px-4 py-2 text-xs text-[#fffaf4]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#8ed085]">
                <span className="h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]" />
                Mở cửa: 07:00 - 22:00
              </span>
              <span className="text-white/60">•</span>
              <span className="text-white/90">Giao nhanh trong 5km</span>
            </div>
            <div className="text-white/80">Hotline: 0987.654.321</div>
          </div>
        </div>
      ) : null}

      {showPromoStrip ? (
        <div className="border-border/60 text-text border-t bg-[#f5e9d9] px-4 py-1.5 text-xs">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span>
              🛵 <strong className="text-primary font-bold">FREESHIP</strong> cho đơn từ 150.000đ
            </span>
            <span className="text-text-muted text-[11px]">Giao trong 20-30 phút</span>
          </div>
        </div>
      ) : null}
    </header>
  );
}

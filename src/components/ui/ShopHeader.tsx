import { BrandLogo } from "./BrandLogo";
import { HeaderCartButton } from "./HeaderCartButton";

export interface ShopHeaderProps {
  cartCount?: number;
  showStoreBanner?: boolean;
  showPromoStrip?: boolean;
  children?: React.ReactNode;
}

export function ShopHeader({
  cartCount,
  showStoreBanner = true,
  showPromoStrip = true,
  children,
}: ShopHeaderProps) {
  return (
    <>
      {showStoreBanner ? (
        <div className="border-border/40 border-b bg-gradient-to-r from-[#442a22] to-[#2f1d17] px-4 py-2 text-xs text-[#fffaf4]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-1">
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
        <div className="border-border/60 text-text border-b bg-[#f5e9d9] px-4 py-1.5 text-xs">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span>
              🛵 <strong className="text-primary font-bold">FREESHIP</strong> cho đơn từ 150.000đ
            </span>
            <span className="text-text-muted text-[11px]">Giao trong 20-30 phút</span>
          </div>
        </div>
      ) : null}

      <header className="border-border/80 bg-surface-raised sticky top-0 z-40 border-b shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <BrandLogo asHeading={true} />
          <HeaderCartButton cartCount={cartCount} />
        </div>
        {children}
      </header>
    </>
  );
}

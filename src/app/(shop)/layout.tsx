import React from "react";
import { getVisibleMenu } from "@/features/menu/queries";
import { getShopSettings } from "@/features/settings/queries";
import { ShopCartWrapper } from "@/features/cart/ShopCartWrapper";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([
    getVisibleMenu(),
    getShopSettings(),
  ]);

  const allProducts = categories.flatMap((c) => c.products);

  const cartSettings = {
    shippingFee: settings.shippingFee,
    freeShippingThreshold: settings.freeShippingThreshold,
  };

  return (
    <ShopCartWrapper menuProducts={allProducts} settings={cartSettings}>
      <div className="flex min-h-screen flex-col bg-surface">
        <div className="flex-1">{children}</div>
        <SiteFooter settings={settings} />
      </div>
    </ShopCartWrapper>
  );
}

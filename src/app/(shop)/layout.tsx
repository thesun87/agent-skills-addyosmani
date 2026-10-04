import React from "react";
import { getVisibleMenu } from "@/features/menu/queries";
import { ShopCartWrapper } from "@/features/cart/ShopCartWrapper";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getVisibleMenu();
  const allProducts = categories.flatMap((c) => c.products);

  const defaultSettings = {
    shippingFee: 15000,
    freeShippingThreshold: 150000,
  };

  return (
    <ShopCartWrapper menuProducts={allProducts} settings={defaultSettings}>
      {children}
    </ShopCartWrapper>
  );
}

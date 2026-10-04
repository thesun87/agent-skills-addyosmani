"use client";

import React from "react";
import { CartProvider } from "./CartContext";
import { CartDrawer } from "./components/CartDrawer";
import { MobileCartBar } from "./components/MobileCartBar";
import type { MenuProduct } from "@/features/menu/queries";

export interface ShopCartWrapperProps {
  children: React.ReactNode;
  menuProducts: readonly MenuProduct[];
  settings: {
    shippingFee: number;
    freeShippingThreshold: number;
  };
}

export function ShopCartWrapper({ children, menuProducts, settings }: ShopCartWrapperProps) {
  return (
    <CartProvider>
      {children}
      <CartDrawer menuProducts={menuProducts} settings={settings} />
      <MobileCartBar menuProducts={menuProducts} settings={settings} />
    </CartProvider>
  );
}

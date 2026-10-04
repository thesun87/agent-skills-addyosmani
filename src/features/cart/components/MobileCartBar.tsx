"use client";

import React, { useMemo } from "react";
import { formatVnd } from "@/lib/money";
import type { MenuProduct } from "@/features/menu/queries";
import { useCart } from "../CartContext";
import { deriveCart } from "../store";

export interface MobileCartBarProps {
  menuProducts: readonly MenuProduct[];
  settings: {
    shippingFee: number;
    freeShippingThreshold: number;
  };
}

export function MobileCartBar({ menuProducts, settings }: MobileCartBarProps) {
  const { items, openDrawer, isDrawerOpen } = useCart();

  const derived = useMemo(() => {
    return deriveCart(items, menuProducts, settings, "DELIVERY");
  }, [items, menuProducts, settings]);

  if (items.length === 0 || isDrawerOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-40 md:hidden">
      <button
        type="button"
        onClick={openDrawer}
        className="bg-primary shadow-primary/30 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-white shadow-xl transition-transform active:scale-98"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold">
            {derived.totalItemCount}
          </span>
          <span className="text-base font-bold">{formatVnd(derived.subtotal)}</span>
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold">
          <span>Xem giỏ hàng</span>
          <span>→</span>
        </span>
      </button>
    </div>
  );
}

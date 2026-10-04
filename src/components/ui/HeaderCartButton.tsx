"use client";

import React from "react";
import { useCart } from "@/features/cart/CartContext";

export interface HeaderCartButtonProps {
  cartCount?: number;
}

export function HeaderCartButton({ cartCount }: HeaderCartButtonProps) {
  const { totalCount, openDrawer } = useCart();
  const count = cartCount ?? totalCount;

  const content = (
    <>
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
      {count > 0 ? (
        <span className="bg-primary flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </>
  );

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="border-border/80 bg-surface text-text hover:border-text/20 relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-[#f3e8d8]"
      aria-label={`Giỏ hàng, hiện có ${count} món`}
    >
      {content}
    </button>
  );
}

"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useCart } from "../CartContext";
import { deriveCart } from "../store";
import type { MenuProduct } from "@/features/menu/queries";
import { formatVnd } from "@/lib/money";

export interface DesktopCartPanelProps {
  menuProducts: readonly MenuProduct[];
  settings?: {
    shippingFee: number;
    freeShippingThreshold: number;
  };
}

export function DesktopCartPanel({
  menuProducts,
  settings = { shippingFee: 15000, freeShippingThreshold: 150000 },
}: DesktopCartPanelProps) {
  const { items, updateQuantity, removeItem } = useCart();

  const derived = useMemo(() => {
    return deriveCart(items, menuProducts, settings, "DELIVERY");
  }, [items, menuProducts, settings]);

  return (
    <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs">
      {/* Header */}
      <div className="border-border/70 flex items-center justify-between border-b pb-3.5">
        <h3 className="font-display text-text text-base font-bold">Giỏ hàng của bạn</h3>
        {derived.totalItemCount > 0 && (
          <span className="bg-primary/10 text-primary flex h-5 items-center justify-center rounded-full px-2.5 text-xs font-bold">
            {derived.totalItemCount} món
          </span>
        )}
      </div>

      {/* Free shipping notice meter */}
      {derived.totalItemCount > 0 && (
        <div className="border-border/60 bg-surface mt-3.5 rounded-xl border p-3 text-xs">
          {derived.amountNeededForFreeShipping === 0 ? (
            <p className="text-support flex items-center gap-1.5 font-bold">
              <span>🎉</span>
              <span>Bạn được miễn phí giao hàng!</span>
            </p>
          ) : (
            <div>
              <p className="text-text-muted">
                🛵 Còn{" "}
                <strong className="text-primary font-bold">
                  {formatVnd(derived.amountNeededForFreeShipping)}
                </strong>{" "}
                để được <strong className="text-primary font-bold">FREESHIP</strong>!
              </p>
              <div className="bg-border/60 mt-2 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (derived.subtotal / (settings?.freeShippingThreshold ?? 150000)) * 100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cart list container */}
      {derived.lines.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-3xl">☕</span>
          <p className="text-text mt-2 text-sm font-semibold">Giỏ hàng đang trống</p>
          <p className="text-text-muted mt-1 text-xs">
            Chọn món từ thực đơn bên cạnh để thêm vào giỏ hàng
          </p>
        </div>
      ) : (
        <div className="divide-border/60 mt-3.5 max-h-[360px] divide-y overflow-y-auto pr-1">
          {derived.lines.map((line) => (
            <div
              key={line.id}
              className={`py-3 first:pt-1 last:pb-1 ${!line.isAvailable ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-text text-sm leading-snug font-bold">{line.productName}</h4>
                <button
                  type="button"
                  onClick={() => removeItem(line.id)}
                  className="text-text-muted hover:text-danger p-0.5 text-xs transition-colors"
                  aria-label={`Xoá ${line.productName}`}
                >
                  ✕
                </button>
              </div>

              {line.selectedOptions.length > 0 && (
                <p className="text-text-muted mt-0.5 text-xs">
                  {line.selectedOptions.map((opt) => opt.name).join(", ")}
                </p>
              )}

              {line.note && (
                <p className="text-text-muted mt-0.5 text-xs italic">Ghi chú: {line.note}</p>
              )}

              {!line.isAvailable && (
                <p className="text-danger mt-1 text-xs font-semibold">
                  ⚠️ {line.unavailableReason ?? "Món tạm hết hàng"}
                </p>
              )}

              <div className="mt-2.5 flex items-center justify-between">
                {line.isAvailable ? (
                  <div className="border-border/80 bg-surface flex h-7 items-center rounded-full border px-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.id, line.quantity - 1)}
                      className="text-text flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold hover:bg-black/5"
                      aria-label="Giảm số lượng"
                    >
                      −
                    </button>
                    <span className="text-text w-6 text-center text-xs font-bold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.id, line.quantity + 1)}
                      className="text-text flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold hover:bg-black/5"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="text-text-muted text-xs">Không khả dụng</span>
                )}

                <span className="text-primary text-sm font-bold">
                  {line.isAvailable ? formatVnd(line.lineTotal) : "0đ"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price breakdown & Checkout button */}
      {derived.lines.length > 0 && (
        <div className="border-border/70 mt-4 space-y-2 border-t pt-3.5 text-xs">
          <div className="text-text-muted flex justify-between">
            <span>Tạm tính ({derived.totalItemCount} món)</span>
            <span className="text-text font-semibold">{formatVnd(derived.subtotal)}</span>
          </div>
          <div className="text-text-muted flex justify-between">
            <span>Phí giao hàng dự kiến</span>
            <span>
              {derived.amountNeededForFreeShipping === 0 ? (
                <span className="text-support font-semibold">Miễn phí</span>
              ) : (
                formatVnd(derived.shippingFee)
              )}
            </span>
          </div>
          <div className="border-border/60 text-text flex justify-between border-t pt-2 text-sm font-bold">
            <span>Tổng cộng</span>
            <span className="text-primary text-base font-bold">{formatVnd(derived.total)}</span>
          </div>

          <Link
            href="/thanh-toan"
            className={`bg-primary hover:bg-primary-hover mt-4 flex h-11 w-full items-center justify-center rounded-full text-sm font-bold text-white shadow-xs transition-all active:scale-98 ${
              derived.availableLines.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Tiến hành thanh toán
          </Link>
        </div>
      )}
    </div>
  );
}

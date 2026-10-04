"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { formatVnd } from "@/lib/money";
import type { MenuProduct } from "@/features/menu/queries";
import { useCart } from "../CartContext";
import { deriveCart } from "../store";

export interface CartViewProps {
  menuProducts: readonly MenuProduct[];
  settings: {
    shippingFee: number;
    freeShippingThreshold: number;
  };
}

export function CartView({ menuProducts, settings }: CartViewProps) {
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const derived = useMemo(() => {
    return deriveCart(items, menuProducts, settings, "DELIVERY");
  }, [items, menuProducts, settings]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Title & Clear action */}
      <div className="border-border/80 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="font-display text-text text-2xl font-bold">Giỏ hàng</h1>
          <p className="text-text-muted mt-1 text-xs">
            {derived.totalItemCount > 0
              ? `${derived.totalItemCount} món đang chờ bạn thanh toán`
              : "Không có món nào trong giỏ"}
          </p>
        </div>
        {derived.lines.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-danger text-xs font-semibold hover:underline"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      {derived.lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-surface flex h-20 w-20 items-center justify-center rounded-full text-4xl">
            🛒
          </div>
          <h2 className="text-text mt-4 text-lg font-bold">Giỏ hàng của bạn đang trống</h2>
          <p className="text-text-muted mt-2 max-w-sm text-sm">
            Thưởng thức cà phê Robusta Đắk Lắk đậm đà và trà trái cây thanh mát cùng Tuấn Linh
            Coffee.
          </p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary-hover mt-6 rounded-full px-6 py-3 text-sm font-bold text-white shadow-xs transition-colors"
          >
            Xem thực đơn ngay
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Item List Column */}
          <div className="space-y-4 lg:col-span-2">
            {/* Free shipping meter */}
            <div className="border-border/70 rounded-2xl border bg-[#f7eedf] p-4 text-sm">
              {derived.amountNeededForFreeShipping === 0 ? (
                <div className="text-support flex items-center gap-2 font-bold">
                  <span>🎉</span>
                  <span>Đơn hàng của bạn đã được MIỄN PHÍ giao hàng!</span>
                </div>
              ) : (
                <div className="text-text">
                  Thêm{" "}
                  <span className="text-primary font-bold">
                    {formatVnd(derived.amountNeededForFreeShipping)}
                  </span>{" "}
                  nữa để nhận <span className="text-support font-bold">Miễn phí giao hàng</span>
                </div>
              )}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#e5d7c3]">
                <div
                  className="bg-support h-full rounded-full transition-all duration-300"
                  style={{ width: `${derived.progressToFreeShipping}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="divide-border/70 border-border/80 bg-surface-raised divide-y rounded-2xl border p-4 shadow-xs sm:p-6">
              {derived.lines.map((line) => (
                <div
                  key={line.id}
                  className={`flex gap-4 py-4 first:pt-0 last:pb-0 ${
                    !line.isAvailable ? "opacity-60" : ""
                  }`}
                >
                  <div className="bg-surface border-border/60 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                    {line.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.productImage}
                        alt={line.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">☕</span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-text text-base font-bold">{line.productName}</h3>
                        <button
                          type="button"
                          onClick={() => removeItem(line.id)}
                          className="text-text-muted hover:text-danger p-1 text-xs"
                          aria-label={`Xoá ${line.productName}`}
                        >
                          ✕
                        </button>
                      </div>

                      {line.selectedOptions.length > 0 && (
                        <p className="text-text-muted mt-1 text-xs">
                          {line.selectedOptions.map((opt) => opt.name).join(", ")}
                        </p>
                      )}

                      {line.note && (
                        <p className="text-text-muted mt-0.5 text-xs italic">
                          Ghi chú: {line.note}
                        </p>
                      )}

                      {!line.isAvailable && (
                        <p className="text-danger mt-1 text-xs font-semibold">
                          ⚠️ {line.unavailableReason ?? "Món tạm hết hàng"}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {line.isAvailable ? (
                        <div className="border-border/80 bg-surface flex h-8 items-center rounded-full border px-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                            className="text-text flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold hover:bg-black/5"
                            aria-label="Giảm số lượng"
                          >
                            −
                          </button>
                          <span className="text-text w-8 text-center text-xs font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            className="text-text flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold hover:bg-black/5"
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="bg-danger/10 text-danger rounded-md px-2 py-0.5 text-xs font-bold">
                          Không tính vào đơn
                        </span>
                      )}

                      <span className="text-primary text-base font-bold">
                        {line.isAvailable ? formatVnd(line.lineTotal) : "0đ"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Column */}
          <div className="lg:col-span-1">
            <div className="border-border/80 bg-surface-raised sticky top-24 rounded-2xl border p-5 shadow-xs">
              <h2 className="font-display text-text text-base font-bold">Tóm tắt đơn hàng</h2>

              <div className="border-border/70 mt-4 space-y-2 border-b pb-4 text-sm">
                <div className="text-text-muted flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-text font-semibold">{formatVnd(derived.subtotal)}</span>
                </div>
                <div className="text-text-muted flex justify-between text-xs">
                  <span>Phí giao hàng</span>
                  <span>Tính tại checkout</span>
                </div>
              </div>

              <div className="text-text mt-4 flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVnd(derived.subtotal)}</span>
              </div>

              <Link
                href="/thanh-toan"
                className={`bg-primary hover:bg-primary-hover mt-6 flex h-12 w-full items-center justify-center rounded-full text-sm font-bold text-white shadow-xs transition-all active:scale-98 ${
                  derived.availableLines.length === 0 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Tiến hành thanh toán
              </Link>

              <Link
                href="/"
                className="text-text-muted hover:text-text mt-3 block text-center text-xs font-semibold"
              >
                ← Tiếp tục chọn món
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

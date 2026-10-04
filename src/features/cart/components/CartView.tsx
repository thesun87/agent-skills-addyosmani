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
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Giỏ hàng</h1>
          <p className="text-xs text-text-muted mt-1">
            {derived.totalItemCount > 0
              ? `${derived.totalItemCount} món đang chờ bạn thanh toán`
              : "Không có món nào trong giỏ"}
          </p>
        </div>
        {derived.lines.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-danger hover:underline"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      {derived.lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-4xl">
            🛒
          </div>
          <h2 className="mt-4 font-bold text-lg text-text">Giỏ hàng của bạn đang trống</h2>
          <p className="mt-2 text-sm text-text-muted max-w-sm">
            Thưởng thức cà phê Robusta Đắk Lắk đậm đà và trà trái cây thanh mát cùng Tuấn Linh Coffee.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-sm text-white shadow-xs hover:bg-primary-hover transition-colors"
          >
            Xem thực đơn ngay
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Item List Column */}
          <div className="space-y-4 lg:col-span-2">
            {/* Free shipping meter */}
            <div className="rounded-2xl border border-border/70 bg-[#f7eedf] p-4 text-sm">
              {derived.amountNeededForFreeShipping === 0 ? (
                <div className="flex items-center gap-2 font-bold text-support">
                  <span>🎉</span>
                  <span>Đơn hàng của bạn đã được MIỄN PHÍ giao hàng!</span>
                </div>
              ) : (
                <div className="text-text">
                  Thêm{" "}
                  <span className="font-bold text-primary">
                    {formatVnd(derived.amountNeededForFreeShipping)}
                  </span>{" "}
                  nữa để nhận <span className="font-bold text-support">Miễn phí giao hàng</span>
                </div>
              )}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#e5d7c3]">
                <div
                  className="h-full rounded-full bg-support transition-all duration-300"
                  style={{ width: `${derived.progressToFreeShipping}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/70 rounded-2xl border border-border/80 bg-surface-raised p-4 sm:p-6 shadow-xs">
              {derived.lines.map((line) => (
                <div
                  key={line.id}
                  className={`flex gap-4 py-4 first:pt-0 last:pb-0 ${
                    !line.isAvailable ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 overflow-hidden">
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
                        <h3 className="font-bold text-base text-text">{line.productName}</h3>
                        <button
                          type="button"
                          onClick={() => removeItem(line.id)}
                          className="text-xs text-text-muted hover:text-danger p-1"
                          aria-label={`Xoá ${line.productName}`}
                        >
                          ✕
                        </button>
                      </div>

                      {line.selectedOptions.length > 0 && (
                        <p className="mt-1 text-xs text-text-muted">
                          {line.selectedOptions.map((opt) => opt.name).join(", ")}
                        </p>
                      )}

                      {line.note && (
                        <p className="mt-0.5 text-xs italic text-text-muted">
                          Ghi chú: {line.note}
                        </p>
                      )}

                      {!line.isAvailable && (
                        <p className="mt-1 text-xs font-semibold text-danger">
                          ⚠️ {line.unavailableReason ?? "Món tạm hết hàng"}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {line.isAvailable ? (
                        <div className="flex h-8 items-center rounded-full border border-border/80 bg-surface px-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center text-sm font-bold text-text hover:bg-black/5 rounded-full"
                            aria-label="Giảm số lượng"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-text">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center text-sm font-bold text-text hover:bg-black/5 rounded-full"
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
                          Không tính vào đơn
                        </span>
                      )}

                      <span className="font-bold text-base text-primary">
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
            <div className="sticky top-24 rounded-2xl border border-border/80 bg-surface-raised p-5 shadow-xs">
              <h2 className="font-display font-bold text-base text-text">Tóm tắt đơn hàng</h2>

              <div className="mt-4 space-y-2 border-b border-border/70 pb-4 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-text">{formatVnd(derived.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Phí giao hàng</span>
                  <span>Tính tại checkout</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between font-bold text-lg text-text">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVnd(derived.subtotal)}</span>
              </div>

              <Link
                href="/thanh-toan"
                className={`mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-sm text-white shadow-xs transition-all hover:bg-primary-hover active:scale-98 ${
                  derived.availableLines.length === 0 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Tiến hành thanh toán
              </Link>

              <Link
                href="/"
                className="mt-3 block text-center text-xs font-semibold text-text-muted hover:text-text"
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

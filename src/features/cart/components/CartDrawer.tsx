"use client";

import React, { useEffect, useId, useMemo } from "react";
import Link from "next/link";
import { formatVnd } from "@/lib/money";
import type { MenuProduct } from "@/features/menu/queries";
import { useCart } from "../CartContext";
import { deriveCart } from "../store";

export interface CartDrawerProps {
  menuProducts: readonly MenuProduct[];
  settings: {
    shippingFee: number;
    freeShippingThreshold: number;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export function CartDrawer({
  menuProducts,
  settings,
  isOpen: propIsOpen,
  onClose: propOnClose,
}: CartDrawerProps) {
  const {
    items,
    updateQuantity,
    removeItem,
    isDrawerOpen: contextIsOpen,
    closeDrawer: contextCloseDrawer,
  } = useCart();

  const titleId = useId();
  const isOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const onClose = propOnClose ?? contextCloseDrawer;

  // Derive cart data from active menu & settings (AD7)
  const derived = useMemo(() => {
    return deriveCart(items, menuProducts, settings, "DELIVERY");
  }, [items, menuProducts, settings]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-surface-raised shadow-2xl transition-transform animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="font-display text-lg font-bold text-text">
              Giỏ hàng của bạn
            </h2>
            {derived.totalItemCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                {derived.totalItemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-black/5 hover:text-text transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Meter */}
        {derived.lines.length > 0 && (
          <div className="border-b border-border/70 bg-[#f7eedf] px-5 py-3 text-xs">
            {derived.amountNeededForFreeShipping === 0 ? (
              <div className="flex items-center gap-1.5 font-bold text-support">
                <span>🎉</span>
                <span>Bạn đã được MIỄN PHÍ giao hàng!</span>
              </div>
            ) : (
              <div className="text-text">
                Thêm{" "}
                <span className="font-bold text-primary">
                  {formatVnd(derived.amountNeededForFreeShipping)}
                </span>{" "}
                để được <span className="font-bold text-support">Miễn phí giao hàng</span>
              </div>
            )}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e5d7c3]">
              <div
                className="h-full rounded-full bg-support transition-all duration-300"
                style={{ width: `${derived.progressToFreeShipping}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {derived.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-3xl">
                🛒
              </div>
              <p className="mt-4 font-bold text-base text-text">Giỏ hàng đang trống</p>
              <p className="mt-1 text-sm text-text-muted max-w-xs">
                Hãy chọn những món đồ uống và bánh thơm ngon từ thực đơn nhé!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-primary-hover transition-colors"
              >
                Xem thực đơn
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {derived.lines.map((line) => (
                <div
                  key={line.id}
                  className={`flex gap-3.5 border-b border-border/70 pb-4 ${
                    !line.isAvailable ? "opacity-60" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 overflow-hidden">
                    {line.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.productImage}
                        alt={line.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">☕</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-text leading-snug">
                          {line.productName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(line.id)}
                          className="text-xs text-text-muted hover:text-danger p-0.5"
                          aria-label={`Xoá ${line.productName}`}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Selected options string */}
                      {line.selectedOptions.length > 0 && (
                        <p className="mt-0.5 text-xs text-text-muted leading-relaxed">
                          {line.selectedOptions.map((opt) => opt.name).join(", ")}
                        </p>
                      )}

                      {/* Note */}
                      {line.note && (
                        <p className="mt-0.5 text-xs italic text-text-muted">
                          Ghi chú: {line.note}
                        </p>
                      )}

                      {/* Unavailable warning */}
                      {!line.isAvailable && (
                        <p className="mt-1 text-xs font-semibold text-danger">
                          ⚠️ {line.unavailableReason ?? "Món tạm hết hàng"}
                        </p>
                      )}
                    </div>

                    {/* Stepper & Price */}
                    <div className="mt-2.5 flex items-center justify-between">
                      {line.isAvailable ? (
                        <div className="flex h-7 items-center rounded-full border border-border/80 bg-surface px-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                            className="flex h-5 w-5 items-center justify-center text-xs font-bold text-text hover:bg-black/5 rounded-full"
                            aria-label="Giảm số lượng"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-text">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            className="flex h-5 w-5 items-center justify-center text-xs font-bold text-text hover:bg-black/5 rounded-full"
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

                      <span className="font-bold text-sm text-primary">
                        {line.isAvailable ? formatVnd(line.lineTotal) : "0đ"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {derived.lines.length > 0 && (
          <div className="border-t border-border/80 bg-surface p-5">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Tạm tính ({derived.totalItemCount} món)</span>
                <span className="font-semibold text-text">{formatVnd(derived.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Phí giao hàng</span>
                <span>Tính tại bước thanh toán</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-base text-text">
                <span>Tổng tiền</span>
                <span className="text-primary">{formatVnd(derived.subtotal)}</span>
              </div>
            </div>

            <Link
              href="/thanh-toan"
              onClick={onClose}
              className={`mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary font-bold text-sm text-white shadow-xs transition-all hover:bg-primary-hover active:scale-98 ${
                derived.availableLines.length === 0
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              Tiến hành thanh toán
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

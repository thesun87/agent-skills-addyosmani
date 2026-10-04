"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@prisma/client";
import { formatVnd } from "@/lib/money";
import type { ShopSettings } from "@/features/settings/schema";
import { OrderTimeline } from "./OrderTimeline";
import { VietQrPanel } from "./VietQrPanel";

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export interface OrderTrackingViewProps {
  order: OrderWithItems;
  settings: ShopSettings;
}

export function OrderTrackingView({ order, settings }: OrderTrackingViewProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus,
  );
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // Poll status every 15 seconds (C8)
  useEffect(() => {
    // If order is completed or cancelled, no need to keep polling
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.code}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) setCurrentStatus(data.status);
          if (data.paymentStatus) setCurrentPaymentStatus(data.paymentStatus);
        }
      } catch {
        // Non-critical poll failure
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [order.code, currentStatus]);

  const copyOrderCode = () => {
    navigator.clipboard.writeText(order.code).then(() => {
      setIsCopiedCode(true);
      setTimeout(() => setIsCopiedCode(false), 2000);
    });
  };

  // Partially mask phone for UI privacy
  const maskedPhone =
    order.customerPhone.length >= 10
      ? `${order.customerPhone.slice(0, 4)}***${order.customerPhone.slice(-3)}`
      : order.customerPhone;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Top action & Code card */}
      <div className="border-border/80 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <span className="text-text-muted text-xs font-semibold">Chi tiết đơn hàng</span>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="font-display text-text font-mono text-2xl font-bold">{order.code}</h1>
            <button
              type="button"
              onClick={copyOrderCode}
              className="bg-surface border-border/80 text-text rounded-full border px-2.5 py-1 text-xs font-semibold hover:bg-black/5 active:scale-95"
            >
              {isCopiedCode ? "✓ Đã chép mã" : "Sao chép"}
            </button>
          </div>
        </div>

        <Link
          href="/"
          className="border-border/80 bg-surface-raised text-text rounded-full border px-4 py-2 text-xs font-bold hover:bg-black/5"
        >
          ← Về thực đơn chính
        </Link>
      </div>

      {/* Timeline */}
      <OrderTimeline
        status={currentStatus}
        fulfillment={order.fulfillment}
        cancelReason={order.cancelReason}
      />

      {/* VietQR Panel if bank transfer */}
      {order.paymentMethod === "BANK_TRANSFER" && (
        <VietQrPanel
          orderCode={order.code}
          amount={order.total}
          paymentStatus={currentPaymentStatus}
          settings={settings}
        />
      )}

      {/* Order info & items grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Customer & Fulfillment Info */}
        <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs">
          <h2 className="font-display text-text mb-3 text-base font-bold">Thông tin nhận hàng</h2>

          <div className="text-text-muted space-y-2.5 text-xs">
            <div>
              <span className="text-text font-semibold">Người nhận:</span> {order.customerName}
            </div>
            <div>
              <span className="text-text font-semibold">Số điện thoại:</span> {maskedPhone}
            </div>
            <div>
              <span className="text-text font-semibold">Hình thức:</span>{" "}
              {order.fulfillment === "DELIVERY" ? "Giao tận nơi" : "Lấy tại quán"}
            </div>

            {order.fulfillment === "DELIVERY" && order.deliveryAddress && (
              <div>
                <span className="text-text font-semibold">Địa chỉ giao:</span>{" "}
                <span className="text-text">{order.deliveryAddress}</span>
              </div>
            )}

            {order.fulfillment === "PICKUP" && (
              <div>
                <span className="text-text font-semibold">Địa chỉ quán:</span>{" "}
                <span className="text-text">{settings.address}</span>
              </div>
            )}

            {order.note && (
              <div>
                <span className="text-text font-semibold">Ghi chú:</span>{" "}
                <span className="italic">{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Items Summary */}
        <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs">
          <h2 className="font-display text-text mb-3 text-base font-bold">
            Món đã đặt ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
          </h2>

          <div className="divide-border/60 max-h-48 divide-y overflow-y-auto pr-1">
            {order.items.map((item) => {
              let options: { name: string }[] = [];
              try {
                if (typeof item.selectedOptions === "string") {
                  options = JSON.parse(item.selectedOptions);
                } else if (Array.isArray(item.selectedOptions)) {
                  options = item.selectedOptions as unknown as { name: string }[];
                }
              } catch {
                // Ignore parse errors
              }

              return (
                <div
                  key={item.id}
                  className="flex justify-between gap-2 py-2 text-xs first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="text-text font-bold">
                      {item.quantity}× {item.productName}
                    </span>
                    {options.length > 0 && (
                      <p className="text-text-muted mt-0.5 text-[11px]">
                        {options.map((o) => o.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="text-text font-semibold whitespace-nowrap">
                    {formatVnd(item.lineTotal)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-border/70 mt-4 space-y-1.5 border-t pt-3 text-xs">
            <div className="text-text-muted flex justify-between">
              <span>Tạm tính</span>
              <span className="text-text font-semibold">{formatVnd(order.subtotal)}</span>
            </div>
            <div className="text-text-muted flex justify-between">
              <span>Phí giao hàng</span>
              <span className="text-text font-semibold">
                {order.shippingFee === 0 ? "0đ (Miễn phí)" : formatVnd(order.shippingFee)}
              </span>
            </div>
            <div className="border-border/60 text-text flex justify-between border-t pt-2 text-sm font-bold">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVnd(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import type { OrderStatus, FulfillmentType } from "@prisma/client";

export interface OrderTimelineProps {
  status: OrderStatus;
  fulfillment: FulfillmentType;
  cancelReason?: string | null;
}

interface Step {
  key: OrderStatus;
  label: string;
}

export function OrderTimeline({ status, fulfillment, cancelReason }: OrderTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className="border-danger/30 bg-danger-bg text-danger rounded-2xl border p-5">
        <div className="flex items-center gap-2.5 text-base font-bold">
          <span className="text-xl">❌</span>
          <span>Đơn hàng đã bị huỷ</span>
        </div>
        {cancelReason && (
          <p className="text-text-muted mt-2 text-xs">
            Lý do huỷ: <strong className="text-danger">{cancelReason}</strong>
          </p>
        )}
      </div>
    );
  }

  const steps: Step[] =
    fulfillment === "PICKUP"
      ? [
          { key: "PENDING", label: "Chờ quán duyệt" },
          { key: "CONFIRMED", label: "Đã nhận đơn" },
          { key: "PREPARING", label: "Đang pha chế" },
          { key: "READY_FOR_PICKUP", label: "Sẵn sàng lấy món" },
          { key: "COMPLETED", label: "Đã hoàn thành" },
        ]
      : [
          { key: "PENDING", label: "Chờ quán duyệt" },
          { key: "CONFIRMED", label: "Đã nhận đơn" },
          { key: "PREPARING", label: "Đang pha chế" },
          { key: "DELIVERING", label: "Đang giao hàng" },
          { key: "COMPLETED", label: "Giao thành công" },
        ];

  const statusOrder: Record<OrderStatus, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 2,
    READY_FOR_PICKUP: 3,
    DELIVERING: 3,
    COMPLETED: 4,
    CANCELLED: -1,
  };

  const currentIdx = statusOrder[status];

  return (
    <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs sm:p-6">
      <h2 className="font-display text-text mb-6 text-base font-bold">Trạng thái đơn hàng</h2>

      <div className="relative flex items-center justify-between">
        {/* Progress connecting line */}
        <div className="bg-border/60 absolute top-4 right-4 left-4 z-0 h-1 -translate-y-1/2">
          <div
            className="bg-support h-full transition-all duration-500"
            style={{
              width: `${(Math.min(currentIdx, steps.length - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-support text-white shadow-xs"
                    : isCurrent
                      ? "bg-primary ring-primary/20 animate-pulse text-white shadow-xs ring-4"
                      : "bg-surface border-border text-text-muted border"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>

              <span
                className={`mt-2 max-w-[70px] text-[11px] leading-tight font-semibold sm:max-w-[90px] sm:text-xs ${
                  isCurrent
                    ? "text-primary font-bold"
                    : isCompleted
                      ? "text-text"
                      : "text-text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

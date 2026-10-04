import React from "react";

export interface ClosedBannerProps {
  openTime?: string;
}

export function ClosedBanner({ openTime = "07:00" }: ClosedBannerProps) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger-bg text-danger flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm"
    >
      <div className="flex items-center gap-2.5 font-bold">
        <span className="text-lg">⏰</span>
        <span>Quán đang đóng cửa, mở lại lúc {openTime}</span>
      </div>
      <span className="text-text-muted hidden text-xs sm:inline">
        Chỉ nhận đơn trong giờ hoạt động
      </span>
    </div>
  );
}

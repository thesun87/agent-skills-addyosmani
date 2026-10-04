"use client";

import React, { useState } from "react";
import type { PaymentStatus } from "@prisma/client";
import { formatVnd } from "@/lib/money";
import { generateVietQrUrl } from "@/lib/vietqr";
import type { ShopSettings } from "@/features/settings/schema";

export interface VietQrPanelProps {
  orderCode: string;
  amount: number;
  paymentStatus: PaymentStatus;
  settings: ShopSettings;
}

export function VietQrPanel({ orderCode, amount, paymentStatus, settings }: VietQrPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const qrUrl = generateVietQrUrl({
    bankBin: settings.bankBin,
    accountNo: settings.bankAccountNo,
    amount,
    orderCode,
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const isPaid = paymentStatus === "PAID";

  return (
    <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs sm:p-6">
      <div className="border-border/70 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-text text-base font-bold">
            Thanh toán chuyển khoản VietQR
          </h2>
          <p className="text-text-muted mt-0.5 text-xs">
            Quét mã QR bằng ứng dụng ngân hàng bất kỳ để thanh toán nhanh
          </p>
        </div>

        <div>
          {isPaid ? (
            <span className="bg-support/15 text-support inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
              <span>✓</span>
              <span>ĐÃ THANH TOÁN</span>
            </span>
          ) : (
            <span className="bg-accent/20 text-text inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
              <span>⏳</span>
              <span>CHỜ THANH TOÁN</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
        {/* QR Code Container */}
        <div className="border-border/80 flex flex-col items-center justify-center rounded-2xl border bg-white p-3 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`Mã VietQR thanh toán cho đơn hàng ${orderCode}`}
            className="aspect-square w-full max-w-[240px] rounded-xl object-contain"
            loading="eager"
          />
          <p className="text-text-muted mt-2 text-center text-[11px] font-medium">
            {isPaid ? "Quán đã đối soát thành công" : "Quét mã để tự động điền số tiền và mã đơn"}
          </p>
        </div>

        {/* Bank Details & Copy Pills */}
        <div className="space-y-3">
          <div className="border-border/70 bg-surface rounded-xl border p-3 text-xs">
            <span className="text-text-muted block">Ngân hàng thụ hưởng:</span>
            <span className="text-text text-sm font-bold">MBBank (Ngân hàng Quân Đội)</span>
          </div>

          <div className="border-border/70 bg-surface flex items-center justify-between rounded-xl border p-3 text-xs">
            <div>
              <span className="text-text-muted block">Số tài khoản:</span>
              <span className="text-text font-mono text-sm font-bold tracking-wider">
                {settings.bankAccountNo}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(settings.bankAccountNo, "acc")}
              className="bg-surface-raised border-border/80 text-text rounded-lg border px-2.5 py-1 text-xs font-semibold hover:bg-black/5 active:scale-95"
            >
              {copiedKey === "acc" ? "✓ Đã chép" : "Sao chép"}
            </button>
          </div>

          <div className="border-border/70 bg-surface rounded-xl border p-3 text-xs">
            <span className="text-text-muted block">Tên chủ tài khoản:</span>
            <span className="text-text text-sm font-bold uppercase">
              {settings.bankAccountName}
            </span>
          </div>

          <div className="border-border/70 bg-surface flex items-center justify-between rounded-xl border p-3 text-xs">
            <div>
              <span className="text-text-muted block">Số tiền cần chuyển:</span>
              <span className="text-primary text-base font-bold">{formatVnd(amount)}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(String(amount), "amount")}
              className="bg-surface-raised border-border/80 text-text rounded-lg border px-2.5 py-1 text-xs font-semibold hover:bg-black/5 active:scale-95"
            >
              {copiedKey === "amount" ? "✓ Đã chép" : "Sao chép"}
            </button>
          </div>

          <div className="border-primary/40 bg-primary/5 flex items-center justify-between rounded-xl border p-3 text-xs">
            <div>
              <span className="text-text-muted block font-medium">
                Nội dung chuyển khoản (bắt buộc):
              </span>
              <span className="text-primary font-mono text-sm font-bold">{orderCode}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(orderCode, "code")}
              className="bg-primary hover:bg-primary-hover rounded-lg px-2.5 py-1 text-xs font-bold text-white active:scale-95"
            >
              {copiedKey === "code" ? "✓ Đã chép" : "Sao chép"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

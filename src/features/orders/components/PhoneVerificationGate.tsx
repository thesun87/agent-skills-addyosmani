"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyOrderPhone } from "../actions";

export interface PhoneVerificationGateProps {
  code: string;
}

export function PhoneVerificationGate({ code }: PhoneVerificationGateProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.trim().length < 9) {
      setError("Vui lòng nhập đúng số điện thoại đặt hàng.");
      return;
    }

    startTransition(async () => {
      const res = await verifyOrderPhone(code, phone.trim());
      if (!res.success) {
        setError(res.message ?? "Số điện thoại không chính xác.");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl">
        🔒
      </div>

      <h1 className="font-display text-text mt-4 text-xl font-bold">Xác minh thông tin đơn hàng</h1>
      <p className="text-text-muted mt-2 text-xs leading-relaxed">
        Để bảo mật thông tin cá nhân và đơn hàng, vui lòng nhập số điện thoại bạn đã dùng khi đặt mã{" "}
        <strong className="text-text font-bold">{code}</strong>.
      </p>

      {error && (
        <div
          role="alert"
          className="border-danger/30 bg-danger-bg text-danger mt-4 rounded-xl border p-3 text-xs font-semibold"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="mt-6 space-y-4">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Nhập số điện thoại (10 chữ số)"
          className="border-border/80 bg-surface-raised text-text placeholder:text-text-muted/60 focus:border-primary w-full rounded-full border px-4 py-3 text-center text-sm font-semibold focus:bg-white focus:outline-hidden"
          autoFocus
        />

        <button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary-hover flex h-11 w-full items-center justify-center rounded-full text-sm font-bold text-white shadow-xs active:scale-98 disabled:opacity-50"
        >
          {isPending ? "Đang kiểm tra..." : "Xem chi tiết đơn hàng"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAdminAction, type LoginActionState } from "../actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginActionState | null, FormData>(
    loginAdminAction,
    null
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!state?.isLocked || !state?.lockedUntil) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isLocked, state?.lockedUntil]);

  const targetTime = state?.lockedUntil ? new Date(state.lockedUntil).getTime() : 0;
  const lockoutRemainingSecs =
    state?.isLocked && targetTime > now
      ? Math.max(0, Math.floor((targetTime - now) / 1000))
      : 0;

  const isLocked = !!state?.isLocked && lockoutRemainingSecs > 0;

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="login-card w-full max-w-[420px] rounded-2xl bg-white p-7 md:p-8 shadow-2xl border border-[#4a3329]/20 flex flex-col gap-5">
      <div className="login-header text-center flex flex-col items-center gap-2">
        <svg
          className="login-logo w-16 h-16"
          viewBox="0 0 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="90" cy="90" r="86" fill="#B8322A" />
          <circle
            cx="90"
            cy="90"
            r="76"
            fill="none"
            stroke="#FBF5EC"
            strokeWidth="2"
            opacity="0.6"
          />
          <path
            d="M90 22 C 104 40, 112 52, 108 68 C 106 78, 98 84, 90 86 C 80 84, 72 76, 73 65 C 74 56, 80 52, 82 44 C 86 52, 88 58, 86 64 C 92 58, 96 48, 90 22 Z"
            fill="#E8892B"
          />
          <path
            d="M52 92 H128 L120 140 C 118 150, 110 156, 100 156 H80 C 70 156, 62 150, 60 140 Z"
            fill="#FBF5EC"
          />
          <path
            d="M127 102 C 146 102, 146 130, 122 130"
            fill="none"
            stroke="#FBF5EC"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M36 128 C 34 108, 48 96, 64 98 C 64 116, 52 128, 36 128 Z"
            fill="#4E7A47"
          />
        </svg>
        <h2 className="login-title font-display text-2xl font-bold text-text">
          Đăng Nhập Quản Trị
        </h2>
        <p className="login-desc text-xs md:text-sm text-text-muted">
          Hệ thống xử lý đơn & quản lý quầy bar Tuấn Linh Coffee
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="form-group flex flex-col gap-1.5">
          <label className="form-label text-xs font-semibold text-text" htmlFor="login-email">
            Email đăng nhập
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            defaultValue="admin@tuanlinh.coffee"
            className="form-input w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-text outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            required
            disabled={isPending || isLocked}
          />
        </div>

        <div className="form-group flex flex-col gap-1.5">
          <label className="form-label text-xs font-semibold text-text" htmlFor="login-password">
            Mật khẩu
          </label>
          <input
            type="password"
            id="login-password"
            name="password"
            defaultValue="Admin123!@"
            className="form-input w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-sm text-text outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            required
            disabled={isPending || isLocked}
          />
        </div>

        {/* Error Alert (A1) */}
        {state?.error && !isLocked && (
          <div
            className="login-error-alert flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm leading-snug"
            id="login-error-box"
          >
            <span>⚠️</span>
            <span id="login-error-text">{state.error}</span>
          </div>
        )}

        {/* Lockout Alert (A1: 5 failures -> 15 min lock) */}
        {isLocked && (
          <div
            className="login-lockout-alert flex flex-col gap-1.5 p-3.5 rounded-lg bg-[#451a1a] border border-[#991b1b] text-red-100 text-xs md:text-sm"
            id="login-lockout-box"
          >
            <strong className="font-bold text-red-200">
              ⛔ TÀI KHOẢN TẠM THỜI BỊ KHOÁ (15 PHÚT)
            </strong>
            <span>
              Bạn đã nhập sai 5 lần liên tiếp. Để đảm bảo an toàn, hệ thống tạm khoá trong 15 phút.
            </span>
            {lockoutRemainingSecs !== null && (
              <span className="font-bold text-amber-300 mt-1" id="lockout-countdown">
                Thời gian còn lại: {formatCountdown(lockoutRemainingSecs)}
              </span>
            )}
          </div>
        )}

        <button
          type="submit"
          id="btn-submit-login"
          disabled={isPending || isLocked}
          className="login-btn w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold text-sm md:text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? "Đang xác thực..." : "Đăng Nhập Hệ Thống"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { logoutAdminAction } from "../actions";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function LogoutModal({ isOpen, onClose, userName = "Thu Ngân Quầy 1" }: LogoutModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      id="logout-confirm-modal"
    >
      <div className="modal-box w-full max-w-[400px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border flex flex-col">
        <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-border bg-surface-raised">
          <span className="modal-title font-bold text-base text-text">
            🚪 Xác nhận đăng xuất
          </span>
          <button
            type="button"
            className="modal-close text-text-muted hover:text-text text-xl leading-none"
            onClick={onClose}
            disabled={isPending}
          >
            &times;
          </button>
        </div>

        <div className="modal-body p-5">
          <p className="text-sm text-text">
            Bạn có chắc chắn muốn kết thúc ca làm việc và đăng xuất khỏi tài khoản{" "}
            <strong>{userName}</strong>?
          </p>
        </div>

        <div className="modal-footer flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border bg-surface">
          <button
            type="button"
            className="btn-ghost px-4 py-2 rounded-md text-xs font-semibold text-text hover:bg-black/5 transition-all"
            onClick={onClose}
            disabled={isPending}
          >
            Ở lại ca
          </button>
          <button
            type="button"
            className="btn-state-action bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-xs font-bold transition-all disabled:opacity-50"
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { AdminOrderSummary } from "./OrderCard";

interface CancelOrderModalProps {
  order: AdminOrderSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  { label: "Hết nguyên liệu", value: "Hết nguyên liệu pha chế" },
  { label: "Khách xin huỷ", value: "Khách gọi yêu cầu huỷ đơn" },
  { label: "Không nghe máy", value: "Không liên lạc được số điện thoại khách" },
  { label: "Quán quá tải", value: "Quán quá tải giờ cao điểm" },
];

export function CancelOrderModal({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("Hết nguyên liệu pha chế");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do huỷ đơn hàng.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmCancel(order.id, reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Huỷ đơn thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      id="cancel-order-modal"
    >
      <div className="modal-box w-full max-w-[460px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border flex flex-col">
        <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50/70">
          <span className="modal-title font-bold text-base text-red-700">
            ⚠️ Xác nhận huỷ đơn hàng ({order.code})
          </span>
          <button
            type="button"
            className="modal-close text-text-muted hover:text-text text-xl leading-none"
            onClick={onClose}
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="modal-body p-5 flex flex-col gap-3">
            <p className="text-xs md:text-sm text-text">
              Vui lòng chọn hoặc nhập <strong>lý do huỷ đơn</strong> để lưu vào lịch sử đối soát của hệ thống:
            </p>

            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  className={`text-xs px-2.5 py-1 rounded border font-medium transition-all ${
                    reason === r.value
                      ? "bg-red-100 border-red-300 text-red-800 font-semibold"
                      : "bg-surface border-border text-text hover:bg-black/5"
                  }`}
                  onClick={() => setReason(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              className="form-input w-full p-2.5 rounded-lg border border-border bg-surface text-xs md:text-sm text-text outline-none focus:border-primary focus:bg-white"
              id="cancel-reason-input"
              rows={3}
              placeholder="Ghi chú chi tiết lý do huỷ..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              required
            />

            {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
          </div>

          <div className="modal-footer flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border bg-surface">
            <button
              type="button"
              className="btn-ghost px-4 py-2 rounded-md text-xs font-semibold text-text hover:bg-black/5 transition-all"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="btn-state-action bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-xs font-bold transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Huỷ đơn ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

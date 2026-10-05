"use client";

import { formatVnd } from "@/lib/money";
import { type AdminOrderSummary, OrderStatusBadge } from "./OrderCard";

interface OrderDetailProps {
  order?: AdminOrderSummary | null;
  onTransition?: (orderId: string, nextStatus: string) => void;
  onOpenCancelModal?: (order: AdminOrderSummary) => void;
  onMarkPaid?: (orderId: string) => void;
  isActionPending?: boolean;
}

export function OrderDetail({
  order,
  onTransition,
  onOpenCancelModal,
  onMarkPaid,
  isActionPending = false,
}: OrderDetailProps) {
  if (!order) {
    return (
      <div className="orders-detail flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center text-text-muted bg-surface min-h-[400px]">
        <span className="text-4xl mb-2.5">📋</span>
        <p className="text-sm font-semibold">Vui lòng chọn một đơn hàng để xem chi tiết</p>
      </div>
    );
  }

  const isDelivery = order.fulfillment === "DELIVERY";
  const isVietQr = order.paymentMethod === "BANK_TRANSFER";
  const isPaid = order.paymentStatus === "PAID";

  // State machine next valid action
  const renderStateActions = () => {
    switch (order.status) {
      case "PENDING":
        return (
          <button
            type="button"
            className="btn-state-action bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-50"
            disabled={isActionPending}
            onClick={() => onTransition?.(order.id, "CONFIRMED")}
          >
            ✓ Tiếp nhận đơn
          </button>
        );
      case "CONFIRMED":
        return (
          <button
            type="button"
            className="btn-state-action bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-50"
            disabled={isActionPending}
            onClick={() => onTransition?.(order.id, "PREPARING")}
          >
            ☕ Bắt đầu pha chế
          </button>
        );
      case "PREPARING":
        if (isDelivery) {
          return (
            <button
              type="button"
              className="btn-state-action bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-50"
              disabled={isActionPending}
              onClick={() => onTransition?.(order.id, "DELIVERING")}
            >
              🛵 Bắt đầu giao hàng
            </button>
          );
        } else {
          return (
            <button
              type="button"
              className="btn-state-action bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-50"
              disabled={isActionPending}
              onClick={() => onTransition?.(order.id, "READY_FOR_PICKUP")}
            >
              🛍️ Báo khách lấy món
            </button>
          );
        }
      case "DELIVERING":
        return (
          <button
            type="button"
            className="btn-state-action bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-50"
            disabled={isActionPending}
            onClick={() => onTransition?.(order.id, "COMPLETED")}
          >
            🟢 Giao thành công
          </button>
        );
      case "READY_FOR_PICKUP":
        return (
          <button
            type="button"
            className="btn-state-action bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-50"
            disabled={isActionPending}
            onClick={() => onTransition?.(order.id, "COMPLETED")}
          >
            🟢 Khách đã nhận món
          </button>
        );
      default:
        return null;
    }
  };

  const canCancel =
    order.status === "PENDING" || order.status === "CONFIRMED" || order.status === "PREPARING";

  return (
    <div className="orders-detail flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-surface" id="order-detail-pane">
      {/* Top Header Card */}
      <div className="detail-card bg-surface-raised border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div className="detail-header flex items-start justify-between gap-4 flex-wrap">
          <div className="detail-title-group flex flex-col gap-1">
            <div className="detail-code flex items-center gap-3">
              <span className="font-display font-bold text-xl text-text">{order.code}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <span className="detail-meta-text text-xs text-text-muted">
              Đặt lúc: <strong>{new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</strong> · Hình thức:{" "}
              <strong>{isDelivery ? "🛵 Giao tận nơi" : "🛍️ Đặt trước lấy tại quán"}</strong>
            </span>
          </div>

          <div className="detail-actions-top">
            <button
              type="button"
              className="btn-ghost border border-border bg-white text-text hover:bg-surface px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5"
              onClick={() => window.print()}
            >
              🖨️ In phiếu pha chế
            </button>
          </div>
        </div>

        {/* Customer & Delivery Grid */}
        <div className="info-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 border-t border-border-light">
          <div className="info-item flex flex-col">
            <span className="info-label text-[11px] font-semibold text-text-muted uppercase">Khách hàng</span>
            <span className="info-value text-sm font-semibold text-text">{order.customerName}</span>
          </div>

          <div className="info-item flex flex-col">
            <span className="info-label text-[11px] font-semibold text-text-muted uppercase">Số điện thoại</span>
            <span className="info-value text-sm font-semibold text-text flex items-center gap-2">
              {order.customerPhone}
              <a
                href={`tel:${order.customerPhone.replace(/\s+/g, "")}`}
                className="call-link text-xs font-medium text-sky-700 hover:underline"
              >
                📞 Gọi
              </a>
            </span>
          </div>

          <div className="info-item flex flex-col sm:col-span-2 lg:col-span-1">
            <span className="info-label text-[11px] font-semibold text-text-muted uppercase">
              {isDelivery ? "Địa chỉ nhận hàng" : "Giờ nhận món"}
            </span>
            <span className="info-value text-sm font-semibold text-text">
              {isDelivery
                ? order.deliveryAddress || "Không có địa chỉ"
                : order.pickupAt
                ? new Date(order.pickupAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                : "Trong giờ mở cửa"}
            </span>
          </div>

          {order.note && (
            <div className="info-item col-span-full bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-lg flex flex-col">
              <span className="info-label text-[11px] font-semibold text-amber-900 uppercase">Ghi chú từ khách</span>
              <span className="info-value text-xs font-medium text-amber-900">{order.note}</span>
            </div>
          )}

          {order.cancelReason && (
            <div className="info-item col-span-full bg-red-50 border border-red-200 p-2.5 rounded-lg flex flex-col">
              <span className="info-label text-[11px] font-semibold text-red-900 uppercase">Lý do huỷ đơn</span>
              <span className="info-value text-xs font-medium text-red-900">{order.cancelReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items List Table Card */}
      <div className="detail-card bg-surface-raised border border-border rounded-xl p-5 shadow-sm flex flex-col">
        <h3 className="font-semibold text-sm text-text mb-3">Chi tiết món đã đặt</h3>
        <table className="items-table w-full text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-border text-left text-text-muted uppercase text-[11px]">
              <th className="py-2 px-2.5">Món</th>
              <th className="py-2 px-2.5 text-center">SL</th>
              <th className="py-2 px-2.5 text-right">Đơn giá</th>
              <th className="py-2 px-2.5 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const options = Array.isArray(item.selectedOptions)
                ? (item.selectedOptions as Array<{ groupName?: string; optionName?: string; priceDelta?: number }>)
                : [];
              const optionsText = options
                .map((o) => `${o.optionName}${o.priceDelta ? ` (+${formatVnd(o.priceDelta)})` : ""}`)
                .join(", ");

              return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 px-2.5">
                    <div className="font-semibold text-text text-sm">{item.productName}</div>
                    {optionsText && <div className="text-text-muted text-[11.5px] mt-0.5">{optionsText}</div>}
                    {item.note && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1 border-l-2 border-amber-500">
                        {item.note}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2.5 text-center">
                    <span className="item-qty-badge bg-surface px-2 py-0.5 rounded font-bold text-text">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-2.5 text-right text-text-muted">{formatVnd(item.unitPrice)}</td>
                  <td className="py-3 px-2.5 text-right font-bold text-text">{formatVnd(item.lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Price Breakdown */}
        <div className="price-summary-box bg-surface p-3.5 rounded-lg border border-dashed border-border mt-4 flex flex-col gap-1.5 text-xs text-text-muted">
          <div className="price-row flex justify-between">
            <span>Tạm tính ({order.items.reduce((s, i) => s + i.quantity, 0)} món)</span>
            <span className="font-semibold text-text">{formatVnd(order.subtotal)}</span>
          </div>
          <div className="price-row flex justify-between">
            <span>Phí giao hàng</span>
            <span className="font-semibold text-text">
              {order.shippingFee === 0 ? "Miễn phí (Free ship)" : formatVnd(order.shippingFee)}
            </span>
          </div>
          <div className="price-row total-row flex justify-between pt-2 border-t border-border font-bold text-sm text-text items-baseline">
            <span>Tổng thanh toán</span>
            <span className="total-amount text-primary text-base md:text-lg">{formatVnd(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Information Card */}
      <div
        className={`payment-card border-l-4 rounded-xl p-4 shadow-sm flex flex-col gap-2.5 ${
          isPaid ? "border-l-support bg-[#fafdf9]" : "border-l-accent bg-white"
        }`}
      >
        <div className="payment-card-header flex items-center justify-between flex-wrap gap-2">
          <div className="payment-status-title font-bold text-sm flex items-center gap-2">
            <span>{isVietQr ? "💳 Chuyển khoản VietQR" : "💵 Tiền mặt (COD)"}</span>
            {isPaid ? (
              <span className="pay-pill pay-paid bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-semibold">
                ✓ ĐÃ THANH TOÁN
              </span>
            ) : (
              <span className="pay-pill pay-unpaid bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-semibold">
                ⚠️ CHƯA THANH TOÁN
              </span>
            )}
          </div>

          {isVietQr && !isPaid && onMarkPaid && (
            <button
              type="button"
              className="btn-mark-paid bg-support hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
              onClick={() => onMarkPaid(order.id)}
              disabled={isActionPending}
            >
              ✓ Xác nhận đã nhận tiền
            </button>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Dock */}
      <div className="action-dock bg-surface-raised border-2 border-border rounded-2xl p-4 sticky bottom-0 shadow-md flex items-center justify-between gap-3 flex-wrap z-10">
        <div className="action-info flex flex-col">
          <span className="text-xs font-semibold text-text">Bước xử lý tiếp theo:</span>
          <span className="action-hint text-[11px] text-text-muted">
            {order.status === "COMPLETED"
              ? "Đơn hàng đã hoàn tất chu trình."
              : order.status === "CANCELLED"
              ? "Đơn hàng đã bị huỷ."
              : "Chọn hành động phù hợp để chuyển trạng thái đơn"}
          </span>
        </div>

        <div className="action-buttons-group flex items-center gap-2.5 flex-wrap">
          {canCancel && onOpenCancelModal && (
            <button
              type="button"
              className="btn-cancel-action border border-red-300 text-red-600 hover:bg-red-50 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
              onClick={() => onOpenCancelModal(order)}
              disabled={isActionPending}
            >
              ✕ Huỷ đơn
            </button>
          )}

          {renderStateActions()}
        </div>
      </div>
    </div>
  );
}

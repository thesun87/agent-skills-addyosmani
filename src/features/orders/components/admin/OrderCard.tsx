"use client";

import { formatVnd } from "@/lib/money";

export interface OrderItemData {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedOptions?: unknown;
  note?: string | null;
}

export interface AdminOrderSummary {
  id: string;
  code: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillment: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  pickupAt?: Date | string | null;
  note?: string | null;
  cancelReason?: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: Date | string;
  items: OrderItemData[];
}

interface OrderCardProps {
  order: AdminOrderSummary;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
}

function formatOrderTime(dateStr: string | Date) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <span className="status-badge badge-pending">🟡 Chờ xác nhận</span>;
    case "CONFIRMED":
      return <span className="status-badge badge-confirmed">🔵 Đã tiếp nhận</span>;
    case "PREPARING":
      return <span className="status-badge badge-preparing">🟣 Đang pha chế</span>;
    case "DELIVERING":
      return <span className="status-badge badge-delivering">🚚 Đang giao hàng</span>;
    case "READY_FOR_PICKUP":
      return <span className="status-badge badge-ready">🛍️ Chờ khách lấy</span>;
    case "COMPLETED":
      return <span className="status-badge badge-completed">🟢 Hoàn thành</span>;
    case "CANCELLED":
      return <span className="status-badge badge-cancelled">🔴 Đã huỷ</span>;
    default:
      return <span className="status-badge">{status}</span>;
  }
}

export function OrderCard({ order, isSelected, onSelect }: OrderCardProps) {
  const isPending = order.status === "PENDING";
  const itemsBrief = order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ");
  const timeText = formatOrderTime(order.createdAt);

  return (
    <div
      className={`order-card bg-white border rounded-xl p-3 cursor-pointer transition-all shadow-sm flex flex-col gap-2 relative ${
        isSelected ? "selected border-primary ring-2 ring-primary/40 bg-[#fffcf9]" : "border-border hover:border-[#c9b4a4]"
      } ${isPending ? "is-pending border-l-[5px] border-l-accent bg-[#fffdfa]" : ""}`}
      onClick={() => onSelect(order.id)}
    >
      <div className="card-header flex items-center justify-between gap-2">
        <span className="order-code font-bold text-sm text-text">{order.code}</span>
        <span className="order-time text-[11px] text-text-muted flex items-center gap-1">
          🕒 {timeText}
        </span>
      </div>

      <div className="card-badges flex items-center gap-1.5 flex-wrap">
        <OrderStatusBadge status={order.status} />

        {order.fulfillment === "DELIVERY" ? (
          <span className="type-pill type-delivery bg-indigo-50 text-indigo-800 text-[10.5px] px-1.5 py-0.5 rounded font-semibold">
            🛵 Giao hàng
          </span>
        ) : (
          <span className="type-pill type-pickup bg-fuchsia-50 text-fuchsia-800 text-[10.5px] px-1.5 py-0.5 rounded font-semibold">
            🛍️ Lấy tại quán
          </span>
        )}

        {order.paymentMethod === "BANK_TRANSFER" ? (
          order.paymentStatus === "PAID" ? (
            <span className="pay-pill pay-paid bg-emerald-50 text-emerald-700 text-[10.5px] px-1.5 py-0.5 rounded font-semibold">
              QR Đã trả ✓
            </span>
          ) : (
            <span className="pay-pill pay-unpaid bg-red-50 text-red-700 text-[10.5px] px-1.5 py-0.5 rounded font-semibold">
              QR Chưa trả ⚠️
            </span>
          )
        ) : (
          <span className="pay-pill bg-gray-100 text-gray-700 text-[10.5px] px-1.5 py-0.5 rounded font-semibold">
            Tiền mặt
          </span>
        )}
      </div>

      <div className="card-customer flex justify-between items-center text-xs text-text">
        <span className="card-name font-semibold truncate max-w-[180px]">{order.customerName}</span>
        <span className="card-total font-bold text-primary text-sm">{formatVnd(order.total)}</span>
      </div>

      <div
        className="card-summary text-[11.5px] text-text-muted truncate"
        title={itemsBrief}
      >
        {itemsBrief}
      </div>
    </div>
  );
}

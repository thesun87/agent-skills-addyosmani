export type OrderStatusString =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export type FulfillmentTypeString = "DELIVERY" | "PICKUP";

const DELIVERY_FLOW: Record<OrderStatusString, OrderStatusString[]> = {
  PENDING: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["DELIVERING"],
  DELIVERING: ["COMPLETED"],
  READY_FOR_PICKUP: [],
  COMPLETED: [],
  CANCELLED: [],
};

const PICKUP_FLOW: Record<OrderStatusString, OrderStatusString[]> = {
  PENDING: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["COMPLETED"],
  DELIVERING: [],
  COMPLETED: [],
  CANCELLED: [],
};

const CANCELLABLE_STATUSES: Set<OrderStatusString> = new Set([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
]);

export function getNextStatuses(
  current: OrderStatusString,
  fulfillment: FulfillmentTypeString
): OrderStatusString[] {
  const map = fulfillment === "DELIVERY" ? DELIVERY_FLOW : PICKUP_FLOW;
  return map[current] || [];
}

export function canTransition(
  current: OrderStatusString,
  next: OrderStatusString,
  fulfillment: FulfillmentTypeString
): boolean {
  const allowed = getNextStatuses(current, fulfillment);
  return allowed.includes(next);
}

export function canCancel(status: OrderStatusString): boolean {
  return CANCELLABLE_STATUSES.has(status);
}

export function validateTransition(
  current: OrderStatusString,
  next: OrderStatusString,
  fulfillment: FulfillmentTypeString
): { valid: true } | { valid: false; reason: string } {
  if (current === next) {
    return { valid: false, reason: "Đơn hàng đã ở trạng thái này." };
  }

  if (current === "COMPLETED" || current === "CANCELLED") {
    return {
      valid: false,
      reason: "Đơn hàng đã kết thúc chu trình, không thể thay đổi trạng thái.",
    };
  }

  if (!canTransition(current, next, fulfillment)) {
    if (fulfillment === "DELIVERY" && next === "READY_FOR_PICKUP") {
      return { valid: false, reason: "Đơn hàng giao tận nơi không có bước chờ lấy tại quán." };
    }
    if (fulfillment === "PICKUP" && next === "DELIVERING") {
      return { valid: false, reason: "Đơn hàng lấy tại quán không có bước giao hàng." };
    }
    return { valid: false, reason: `Không thể chuyển trạng thái từ ${current} sang ${next}.` };
  }

  return { valid: true };
}

export function validateCancel(
  current: OrderStatusString,
  reason: string
): { valid: true } | { valid: false; reason: string } {
  if (!canCancel(current)) {
    return {
      valid: false,
      reason: `Chỉ có thể huỷ đơn khi đang ở trạng thái Chờ xác nhận, Đã tiếp nhận hoặc Đang pha chế.`,
    };
  }

  if (!reason || !reason.trim()) {
    return { valid: false, reason: "Vui lòng nhập lý do huỷ đơn hàng." };
  }

  return { valid: true };
}

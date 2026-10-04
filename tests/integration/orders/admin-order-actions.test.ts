import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "../helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import {
  transitionOrderAction,
  cancelOrderAction,
  markPaidAction,
} from "@/features/orders/admin-actions";

// Mock requireAdmin to return seeded admin
vi.mock("@/features/auth/require-admin", () => ({
  requireAdmin: vi.fn(async () => {
    const admin = await db.adminUser.findFirst();
    if (!admin) throw new Error("No admin");
    return { id: admin.id, email: admin.email, name: admin.name };
  }),
}));

describe("Admin Order Actions Server Actions (T12, A5, A6)", () => {
  let adminId: string;

  beforeEach(async () => {
    await resetDb();
    const admin = await seedAdminUser();
    adminId = admin.id;
  });

  async function createOrder(status: "PENDING" | "CONFIRMED" | "PREPARING" | "DELIVERING" | "READY_FOR_PICKUP" | "COMPLETED", fulfillment: "DELIVERY" | "PICKUP") {
    return db.order.create({
      data: {
        code: `CF-261004-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: "Khách test",
        customerPhone: "0901234567",
        status,
        fulfillment,
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "UNPAID",
        subtotal: 50000,
        shippingFee: 15000,
        total: 65000,
      },
    });
  }

  it("transitions order status and logs OrderStatusHistory", async () => {
    const order = await createOrder("PENDING", "DELIVERY");

    const result = await transitionOrderAction(order.id, "CONFIRMED");
    expect(result.success).toBe(true);

    const updated = await db.order.findUnique({
      where: { id: order.id },
      include: { statusHistory: true },
    });
    expect(updated?.status).toBe("CONFIRMED");
    expect(updated?.statusHistory.length).toBe(1);
    expect(updated?.statusHistory[0].fromStatus).toBe("PENDING");
    expect(updated?.statusHistory[0].toStatus).toBe("CONFIRMED");
    expect(updated?.statusHistory[0].createdById).toBe(adminId);
  });

  it("rejects invalid state transitions", async () => {
    const order = await createOrder("PENDING", "DELIVERY");

    // PENDING -> DELIVERING is invalid
    const result = await transitionOrderAction(order.id, "DELIVERING");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    const notUpdated = await db.order.findUnique({ where: { id: order.id } });
    expect(notUpdated?.status).toBe("PENDING");
  });

  it("cancels order with mandatory reason and logs history", async () => {
    const order = await createOrder("PENDING", "DELIVERY");

    // Empty reason rejected
    const emptyRes = await cancelOrderAction(order.id, "   ");
    expect(emptyRes.success).toBe(false);

    // Valid cancel
    const cancelRes = await cancelOrderAction(order.id, "Hết nguyên liệu pha chế");
    expect(cancelRes.success).toBe(true);

    const cancelledOrder = await db.order.findUnique({
      where: { id: order.id },
      include: { statusHistory: true },
    });
    expect(cancelledOrder?.status).toBe("CANCELLED");
    expect(cancelledOrder?.cancelReason).toBe("Hết nguyên liệu pha chế");
    expect(cancelledOrder?.statusHistory.some((h) => h.toStatus === "CANCELLED")).toBe(true);
  });

  it("marks VietQR bank transfer as PAID, recording paidAt and paidById", async () => {
    const order = await createOrder("PREPARING", "PICKUP");
    expect(order.paymentStatus).toBe("UNPAID");

    const result = await markPaidAction(order.id);
    expect(result.success).toBe(true);

    const paidOrder = await db.order.findUnique({
      where: { id: order.id },
      include: { statusHistory: true },
    });
    expect(paidOrder?.paymentStatus).toBe("PAID");
    expect(paidOrder?.paidAt).toBeDefined();
    expect(paidOrder?.paidById).toBe(adminId);

    const historyRecord = paidOrder?.statusHistory.find((h) => h.note?.includes("Đã nhận tiền"));
    expect(historyRecord).toBeDefined();
  });
});

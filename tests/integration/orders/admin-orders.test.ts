import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../helpers/reset-db";
import { db } from "@/lib/db";
import { getAdminOrders, getAdminOrderCounts } from "@/features/orders/admin-queries";

describe("Admin Orders Management & Polling Query (T11, A4)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function createTestOrder(overrides: {
    code: string;
    customerPhone: string;
    status: "PENDING" | "CONFIRMED" | "PREPARING" | "DELIVERING" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED";
    fulfillment: "DELIVERY" | "PICKUP";
    createdAt?: Date;
  }) {
    return db.order.create({
      data: {
        code: overrides.code,
        customerName: "Nguyễn Văn A",
        customerPhone: overrides.customerPhone,
        status: overrides.status,
        fulfillment: overrides.fulfillment,
        paymentMethod: "COD",
        subtotal: 50000,
        shippingFee: 15000,
        total: 65000,
        createdAt: overrides.createdAt ?? new Date(),
        items: {
          create: [
            {
              productId: "prod-test-1",
              productName: "Cà phê sữa đá",
              unitPrice: 29000,
              quantity: 2,
              lineTotal: 58000,
              selectedOptions: [],
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
  }

  it("retrieves paginated orders sorted by newest first", async () => {
    const t1 = new Date(Date.now() - 60000);
    const t2 = new Date(Date.now() - 30000);
    const t3 = new Date(Date.now());

    await createTestOrder({ code: "CF-261004-0001", customerPhone: "0901111111", status: "PENDING", fulfillment: "DELIVERY", createdAt: t1 });
    await createTestOrder({ code: "CF-261004-0002", customerPhone: "0902222222", status: "PREPARING", fulfillment: "PICKUP", createdAt: t2 });
    await createTestOrder({ code: "CF-261004-0003", customerPhone: "0903333333", status: "COMPLETED", fulfillment: "DELIVERY", createdAt: t3 });

    const result = await getAdminOrders({ page: 1, limit: 2 });
    expect(result.total).toBe(3);
    expect(result.orders.length).toBe(2);
    // Newest first
    expect(result.orders[0].code).toBe("CF-261004-0003");
    expect(result.orders[1].code).toBe("CF-261004-0002");
  });

  it("filters orders by status correctly", async () => {
    await createTestOrder({ code: "CF-261004-0001", customerPhone: "0901111111", status: "PENDING", fulfillment: "DELIVERY" });
    await createTestOrder({ code: "CF-261004-0002", customerPhone: "0902222222", status: "PENDING", fulfillment: "PICKUP" });
    await createTestOrder({ code: "CF-261004-0003", customerPhone: "0903333333", status: "PREPARING", fulfillment: "DELIVERY" });

    const result = await getAdminOrders({ status: "PENDING" });
    expect(result.total).toBe(2);
    expect(result.orders.every((o) => o.status === "PENDING")).toBe(true);
  });

  it("filters orders by fulfillment type (DELIVERY vs PICKUP)", async () => {
    await createTestOrder({ code: "CF-261004-0001", customerPhone: "0901111111", status: "PENDING", fulfillment: "DELIVERY" });
    await createTestOrder({ code: "CF-261004-0002", customerPhone: "0902222222", status: "PENDING", fulfillment: "PICKUP" });

    const deliveries = await getAdminOrders({ fulfillment: "DELIVERY" });
    expect(deliveries.total).toBe(1);
    expect(deliveries.orders[0].fulfillment).toBe("DELIVERY");

    const pickups = await getAdminOrders({ fulfillment: "PICKUP" });
    expect(pickups.total).toBe(1);
    expect(pickups.orders[0].fulfillment).toBe("PICKUP");
  });

  it("searches orders by partial order code or phone number", async () => {
    await createTestOrder({ code: "CF-261004-9412", customerPhone: "0912345678", status: "PENDING", fulfillment: "DELIVERY" });
    await createTestOrder({ code: "CF-261004-8888", customerPhone: "0987654321", status: "CONFIRMED", fulfillment: "PICKUP" });

    const byCode = await getAdminOrders({ search: "9412" });
    expect(byCode.total).toBe(1);
    expect(byCode.orders[0].code).toBe("CF-261004-9412");

    const byPhone = await getAdminOrders({ search: "0987" });
    expect(byPhone.total).toBe(1);
    expect(byPhone.orders[0].code).toBe("CF-261004-8888");
  });

  it("polls orders created/updated since timestamp", async () => {
    const past = new Date(Date.now() - 10000);
    const orderOld = await createTestOrder({ code: "CF-261004-0001", customerPhone: "0901111111", status: "COMPLETED", fulfillment: "DELIVERY", createdAt: past });

    // Mark updated in past
    await db.order.update({
      where: { id: orderOld.id },
      data: { updatedAt: past },
    });

    const checkpoint = new Date();
    await new Promise((r) => setTimeout(r, 50));

    await createTestOrder({ code: "CF-261004-0002", customerPhone: "0902222222", status: "PENDING", fulfillment: "DELIVERY" });

    const recent = await getAdminOrders({ since: checkpoint.toISOString() });
    expect(recent.total).toBe(1);
    expect(recent.orders[0].code).toBe("CF-261004-0002");
  });

  it("calculates live status counts for filter chips", async () => {
    await createTestOrder({ code: "CF-261004-0001", customerPhone: "0901111111", status: "PENDING", fulfillment: "DELIVERY" });
    await createTestOrder({ code: "CF-261004-0002", customerPhone: "0902222222", status: "PENDING", fulfillment: "PICKUP" });
    await createTestOrder({ code: "CF-261004-0003", customerPhone: "0903333333", status: "PREPARING", fulfillment: "DELIVERY" });
    await createTestOrder({ code: "CF-261004-0004", customerPhone: "0904444444", status: "DELIVERING", fulfillment: "DELIVERY" });
    await createTestOrder({ code: "CF-261004-0005", customerPhone: "0905555555", status: "COMPLETED", fulfillment: "PICKUP" });

    const counts = await getAdminOrderCounts();
    expect(counts.all).toBe(5);
    expect(counts.pending).toBe(2);
    expect(counts.preparing).toBe(1);
    expect(counts.delivering).toBe(1);
    expect(counts.completed).toBe(1);
  });
});

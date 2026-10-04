import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../helpers/reset-db";
import { db } from "@/lib/db";
import { verifyOrderPhone } from "@/features/orders/actions";
import { hashPhoneForOrder } from "@/features/orders/auth";

describe("Order Tracking & Phone Verification Integration (T9, C8)", () => {
  let categoryId: string;
  let orderCode: string;

  beforeEach(async () => {
    await resetDb();

    const cat = await db.category.create({
      data: { name: "Cà phê", sortOrder: 0 },
    });
    categoryId = cat.id;

    const prod = await db.product.create({
      data: {
        categoryId,
        name: "Cà phê đen",
        basePrice: 25000,
      },
    });

    const order = await db.order.create({
      data: {
        code: "CF-261004-9876",
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        fulfillment: "DELIVERY",
        customerName: "Nguyễn Văn Tuấn",
        customerPhone: "0987654321",
        deliveryAddress: "123 Lê Lợi, Q1",
        subtotal: 50000,
        shippingFee: 15000,
        total: 65000,
        items: {
          create: [
            {
              productId: prod.id,
              productName: prod.name,
              unitPrice: 25000,
              quantity: 2,
              lineTotal: 50000,
            },
          ],
        },
      },
    });
    orderCode = order.code;
  });

  it("verifies matching phone number successfully and rejects wrong phone", async () => {
    // Wrong phone
    const wrong = await verifyOrderPhone(orderCode, "0900000000");
    expect(wrong.success).toBe(false);

    // Matching phone (local 10 digits)
    const match = await verifyOrderPhone(orderCode, "0987654321");
    expect(match.success).toBe(true);

    // Matching phone (+84 prefix)
    const matchPlus84 = await verifyOrderPhone(orderCode, "+84987654321");
    expect(matchPlus84.success).toBe(true);
  });

  it("produces deterministic phone hash regardless of formatting", () => {
    const hash1 = hashPhoneForOrder("0987654321");
    const hash2 = hashPhoneForOrder("+84987654321");
    const hash3 = hashPhoneForOrder("0987 654 321");

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  it("never leaks order existence for non-existent order code", async () => {
    const res = await verifyOrderPhone("CF-000000-0000", "0987654321");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.message).toContain("không tồn tại");
    }
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../helpers/reset-db";
import { db } from "@/lib/db";
import { placeOrder } from "@/features/checkout/actions";

describe("placeOrder Server Action Integration (T7, C5, C7, C9-API)", () => {
  let categoryId: string;
  let coffeeId: string;
  let sizeMId: string;
  let sizeLId: string;
  let toppingId: string;
  let soldOutId: string;

  beforeEach(async () => {
    await resetDb();

    // Seed test shop settings (00:00 - 23:59 so shop is always open during tests)
    await db.shopSettings.create({
      data: {
        id: "default",
        shopName: "Tuấn Linh Coffee Test",
        address: "123 Lê Lợi, Q1",
        phone: "0987654321",
        openTime: "00:00",
        closeTime: "23:59",
        shippingFee: 15000,
        freeShippingThreshold: 150000,
      },
    });

    // Seed category & products
    const cat = await db.category.create({
      data: { name: "Cà phê", sortOrder: 0 },
    });
    categoryId = cat.id;

    const coffee = await db.product.create({
      data: {
        categoryId,
        name: "Cà phê sữa đá",
        basePrice: 29000,
        isAvailable: true,
        optionGroups: {
          create: [
            {
              name: "Size",
              isRequired: true,
              maxSelect: 1,
              options: {
                create: [
                  { name: "Size M", priceDelta: 0, sortOrder: 0 },
                  { name: "Size L", priceDelta: 6000, sortOrder: 1 },
                ],
              },
            },
            {
              name: "Topping",
              isRequired: false,
              maxSelect: 2,
              options: {
                create: [{ name: "Bánh Flan", priceDelta: 10000, sortOrder: 0 }],
              },
            },
          ],
        },
      },
      include: {
        optionGroups: {
          include: { options: true },
        },
      },
    });
    coffeeId = coffee.id;
    sizeMId = coffee.optionGroups[0].options[0].id;
    sizeLId = coffee.optionGroups[0].options[1].id;
    toppingId = coffee.optionGroups[1].options[0].id;

    const soldOut = await db.product.create({
      data: {
        categoryId,
        name: "Bạc xỉu đặc biệt",
        basePrice: 35000,
        isAvailable: false,
      },
    });
    soldOutId = soldOut.id;
  });

  it("places delivery order successfully, calculating totals from DB", async () => {
    const input = {
      fulfillment: "DELIVERY",
      customerName: "Tuấn Đỗ",
      customerPhone: "0987654321",
      paymentMethod: "COD",
      deliveryAddress: "456 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
      items: [
        {
          productId: coffeeId,
          optionIds: [sizeLId, toppingId], // 29k + 6k + 10k = 45k
          quantity: 2, // 90k
        },
      ],
    };

    const result = await placeOrder(input, "192.168.1.1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.code).toMatch(/^CF-\d{6}-[A-Z0-9]{4}$/);

    // Verify database record
    const order = await db.order.findUnique({
      where: { code: result.data.code },
      include: { items: true, statusHistory: true },
    });

    expect(order).not.toBeNull();
    expect(order?.status).toBe("PENDING");
    expect(order?.paymentStatus).toBe("UNPAID");
    expect(order?.subtotal).toBe(90000);
    expect(order?.shippingFee).toBe(15000); // subtotal < 150k threshold
    expect(order?.total).toBe(105000);

    // Verify item snapshots
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0].productName).toBe("Cà phê sữa đá");
    expect(order?.items[0].unitPrice).toBe(45000);
    expect(order?.items[0].lineTotal).toBe(90000);

    // Verify status history
    expect(order?.statusHistory).toHaveLength(1);
    expect(order?.statusHistory[0].toStatus).toBe("PENDING");
  });

  it("applies free shipping when subtotal reaches threshold", async () => {
    const input = {
      fulfillment: "DELIVERY",
      customerName: "Linh Trần",
      customerPhone: "0901234567",
      paymentMethod: "BANK_TRANSFER",
      deliveryAddress: "789 Đồng Khởi, Quận 1",
      items: [
        {
          productId: coffeeId,
          optionIds: [sizeLId], // 35k
          quantity: 5, // 175k >= 150k free shipping threshold
        },
      ],
    };

    const result = await placeOrder(input, "192.168.1.2");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const order = await db.order.findUnique({
      where: { code: result.data.code },
    });

    expect(order?.subtotal).toBe(175000);
    expect(order?.shippingFee).toBe(0);
    expect(order?.total).toBe(175000);
  });

  it("rejects order when shop is closed", async () => {
    // Set shop opening hours to a range that is not open
    await db.shopSettings.update({
      where: { id: "default" },
      data: { openTime: "01:00", closeTime: "01:01" },
    });

    const input = {
      fulfillment: "PICKUP",
      customerName: "Hải Nam",
      customerPhone: "0912345678",
      paymentMethod: "COD",
      pickupAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      items: [
        {
          productId: coffeeId,
          optionIds: [sizeMId],
          quantity: 1,
        },
      ],
    };

    const result = await placeOrder(input, "192.168.1.3");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("SHOP_CLOSED");
    }
  });

  it("rejects order with ITEM_UNAVAILABLE when product is sold out", async () => {
    const input = {
      fulfillment: "PICKUP",
      customerName: "Hải Nam",
      customerPhone: "0912345678",
      paymentMethod: "COD",
      pickupAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      items: [
        {
          productId: soldOutId,
          optionIds: [],
          quantity: 1,
        },
      ],
    };

    const result = await placeOrder(input, "192.168.1.4");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ITEM_UNAVAILABLE");
      expect(result.message).toContain("Bạc xỉu đặc biệt");
    }
  });

  it("enforces rate limit: 6th order within 10 minutes returns RATE_LIMITED", async () => {
    const ip = "10.0.0.99";
    const input = {
      fulfillment: "DELIVERY",
      customerName: "Spammer",
      customerPhone: "0987654321",
      paymentMethod: "COD",
      deliveryAddress: "123 Đường Test, Quận 1",
      items: [
        {
          productId: coffeeId,
          optionIds: [sizeMId],
          quantity: 1,
        },
      ],
    };

    // First 5 orders succeed
    for (let i = 0; i < 5; i++) {
      const res = await placeOrder(input, ip);
      expect(res.success).toBe(true);
    }

    // 6th order rejected
    const sixth = await placeOrder(input, ip);
    expect(sixth.success).toBe(false);
    if (!sixth.success) {
      expect(sixth.error).toBe("RATE_LIMITED");
    }
  });
});

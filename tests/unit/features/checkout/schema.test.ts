import { describe, it, expect } from "vitest";
import { placeOrderSchema } from "@/features/checkout/schema";

describe("placeOrderSchema (C4, C6, C7)", () => {
  const validDeliveryPayload = {
    fulfillment: "DELIVERY",
    customerName: "Nguyễn Văn Tuấn",
    customerPhone: "0987654321",
    paymentMethod: "COD",
    deliveryAddress: "123 Lê Lợi, Phường Bến Nghé, Quận 1",
    items: [
      {
        productId: "prod-1",
        optionIds: ["opt-size-m"],
        quantity: 2,
      },
    ],
  };

  it("accepts valid delivery order", () => {
    const result = placeOrderSchema.safeParse(validDeliveryPayload);
    expect(result.success).toBe(true);
  });

  it("requires deliveryAddress when fulfillment is DELIVERY", () => {
    const result = placeOrderSchema.safeParse({
      ...validDeliveryPayload,
      deliveryAddress: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.deliveryAddress).toBeDefined();
    }
  });

  it("requires pickupAt when fulfillment is PICKUP", () => {
    const result = placeOrderSchema.safeParse({
      ...validDeliveryPayload,
      fulfillment: "PICKUP",
      deliveryAddress: undefined,
      pickupAt: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.pickupAt).toBeDefined();
    }
  });

  it("validates Vietnamese phone number format", () => {
    const invalidPhone = placeOrderSchema.safeParse({
      ...validDeliveryPayload,
      customerPhone: "12345",
    });
    expect(invalidPhone.success).toBe(false);

    const validPlus84 = placeOrderSchema.safeParse({
      ...validDeliveryPayload,
      customerPhone: "+84987654321",
    });
    expect(validPlus84.success).toBe(true);
  });

  it("rejects empty items list", () => {
    const result = placeOrderSchema.safeParse({
      ...validDeliveryPayload,
      items: [],
    });
    expect(result.success).toBe(false);
  });
});

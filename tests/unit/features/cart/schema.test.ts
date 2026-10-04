import { describe, expect, it } from "vitest";
import { cartLineSchema } from "@/features/cart/schema";

describe("cartLineSchema", () => {
  it("validates a valid cart line", () => {
    const valid = {
      productId: "prod-1",
      optionIds: ["opt-size-l", "opt-sugar-50"],
      quantity: 2,
      note: "Ít ngọt",
    };

    const result = cartLineSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(valid);
    }
  });

  it("applies defaults for optionIds and note", () => {
    const minimal = {
      productId: "prod-1",
      quantity: 1,
    };

    const result = cartLineSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.optionIds).toEqual([]);
      expect(result.data.note).toEqual("");
    }
  });

  it("rejects empty productId", () => {
    const invalid = {
      productId: "",
      quantity: 1,
    };

    const result = cartLineSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects quantity < 1 or quantity > 50 or float quantity", () => {
    expect(cartLineSchema.safeParse({ productId: "p1", quantity: 0 }).success).toBe(false);
    expect(cartLineSchema.safeParse({ productId: "p1", quantity: -1 }).success).toBe(false);
    expect(cartLineSchema.safeParse({ productId: "p1", quantity: 51 }).success).toBe(false);
    expect(cartLineSchema.safeParse({ productId: "p1", quantity: 1.5 }).success).toBe(false);
  });

  it("rejects notes longer than 200 characters", () => {
    const longNote = "a".repeat(201);
    expect(cartLineSchema.safeParse({ productId: "p1", quantity: 1, note: longNote }).success).toBe(
      false,
    );
  });
});

import { describe, expect, it } from "vitest";
import { calculateTotals, calculateUnitPrice } from "@/lib/pricing";

const settings = { shippingFee: 15_000, freeShippingThreshold: 150_000 };

describe("calculateUnitPrice", () => {
  it("adds option price deltas to the base price", () => {
    expect(calculateUnitPrice(29_000, [6_000, 8_000])).toBe(43_000);
  });

  it("returns the base price when no option has a delta", () => {
    expect(calculateUnitPrice(25_000, [])).toBe(25_000);
  });
});

describe("calculateTotals", () => {
  it("charges the flat shipping fee for delivery below the threshold", () => {
    const totals = calculateTotals(
      [
        { unitPrice: 29_000, quantity: 2 },
        { unitPrice: 39_000, quantity: 1 },
      ],
      "DELIVERY",
      settings,
    );

    expect(totals).toEqual({ subtotal: 97_000, shippingFee: 15_000, total: 112_000 });
  });

  it("ships for free when the subtotal reaches the threshold exactly", () => {
    const totals = calculateTotals([{ unitPrice: 50_000, quantity: 3 }], "DELIVERY", settings);

    expect(totals).toEqual({ subtotal: 150_000, shippingFee: 0, total: 150_000 });
  });

  it("charges shipping when the subtotal is one dong below the threshold", () => {
    const totals = calculateTotals([{ unitPrice: 149_999, quantity: 1 }], "DELIVERY", settings);

    expect(totals.shippingFee).toBe(15_000);
  });

  it("never charges shipping for pickup", () => {
    const totals = calculateTotals([{ unitPrice: 25_000, quantity: 1 }], "PICKUP", settings);

    expect(totals).toEqual({ subtotal: 25_000, shippingFee: 0, total: 25_000 });
  });

  it("returns zeros for an empty cart without charging shipping", () => {
    expect(calculateTotals([], "DELIVERY", settings)).toEqual({
      subtotal: 0,
      shippingFee: 0,
      total: 0,
    });
  });
});

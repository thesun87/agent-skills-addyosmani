import { describe, it, expect } from "vitest";
import { generateOrderCode, isValidOrderCode } from "@/features/orders/order-code";

describe("generateOrderCode (AD1, C8)", () => {
  it("matches CF-YYMMDD-XXXX format", () => {
    const fixedDate = new Date("2026-10-04T12:00:00+07:00");
    const code = generateOrderCode(fixedDate);
    expect(code).toMatch(/^CF-261004-[A-Z0-9]{4}$/);
    expect(isValidOrderCode(code)).toBe(true);
  });

  it("handles custom or current date", () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^CF-\d{6}-[A-Z0-9]{4}$/);
  });

  it("generates unique codes across 1,000 iterations", () => {
    const set = new Set<string>();
    const count = 1000;
    const now = new Date("2026-10-04T15:30:00+07:00");

    for (let i = 0; i < count; i++) {
      const code = generateOrderCode(now);
      set.add(code);
    }

    // With 36^4 = 1,679,616 combinations, collision probability in 1,000 trials is ~0.03%
    // Expect at least 995 unique codes
    expect(set.size).toBeGreaterThanOrEqual(995);
  });

  it("validates valid and invalid codes", () => {
    expect(isValidOrderCode("CF-261004-ABCD")).toBe(true);
    expect(isValidOrderCode("CF-261004-1234")).toBe(true);
    expect(isValidOrderCode("cf-261004-abcd")).toBe(false); // must be uppercase
    expect(isValidOrderCode("CF-26100-ABCD")).toBe(false); // 5 digits date
    expect(isValidOrderCode("CF-261004-ABC")).toBe(false); // 3 chars random
    expect(isValidOrderCode("OTHER-CODE")).toBe(false);
  });
});

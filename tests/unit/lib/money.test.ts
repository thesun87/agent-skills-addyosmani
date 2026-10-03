import { describe, expect, it } from "vitest";
import { formatVnd } from "@/lib/money";

describe("formatVnd", () => {
  it.each([
    [0, "0đ"],
    [15_000, "15.000đ"],
    [29_000, "29.000đ"],
    [1_250_000, "1.250.000đ"],
    [-6_000, "-6.000đ"],
  ])("formats %i as %s", (amount, expected) => {
    expect(formatVnd(amount)).toBe(expected);
  });

  it("rejects non-integer amounts, since VND has no minor unit", () => {
    expect(() => formatVnd(29_000.5)).toThrow(RangeError);
  });
});

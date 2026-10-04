import { describe, it, expect } from "vitest";
import { generateVietQrUrl, type VietQrParams } from "@/lib/vietqr";

describe("generateVietQrUrl (T9, C6)", () => {
  it("generates correct VietQR image URL with amount and order code in addInfo", () => {
    const params: VietQrParams = {
      bankBin: "970422",
      accountNo: "0987654321",
      amount: 105000,
      orderCode: "CF-261004-ABCD",
    };

    const url = generateVietQrUrl(params);

    expect(url).toBe(
      "https://img.vietqr.io/image/970422-0987654321-compact2.png?amount=105000&addInfo=CF-261004-ABCD",
    );
  });

  it("properly encodes orderCode if special characters exist", () => {
    const params: VietQrParams = {
      bankBin: "970415",
      accountNo: "123456789",
      amount: 45000,
      orderCode: "CF 261004 ABCD",
    };

    const url = generateVietQrUrl(params);
    expect(url).toContain("addInfo=CF%20261004%20ABCD");
  });
});

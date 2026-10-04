"use server";

import { db } from "@/lib/db";
import { type Result, ok, err } from "@/lib/result";
import { checkRateLimit } from "@/lib/rate-limit";
import { setOrderAccessCookie } from "./auth";

/**
 * Verifies customer phone for order lookup privacy (C8).
 * Never leaks order existence on failure.
 */
export async function verifyOrderPhone(code: string, phone: string): Promise<Result<boolean>> {
  // Rate limit verification attempts (5 attempts per 15 minutes, AD4)
  const rateLimit = await checkRateLimit(`verify:${code}`, 5, 900);
  if (!rateLimit.allowed) {
    return err("RATE_LIMITED", "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.");
  }

  const order = await db.order.findUnique({
    where: { code },
    select: { customerPhone: true },
  });

  if (!order) {
    return err("NOT_FOUND", "Số điện thoại không khớp với đơn hàng hoặc đơn không tồn tại.");
  }

  const cleanInput = phone.replace(/\D/g, "").slice(-9);
  const cleanOrderPhone = order.customerPhone.replace(/\D/g, "").slice(-9);

  if (cleanInput.length < 9 || cleanInput !== cleanOrderPhone) {
    return err("INVALID_PHONE", "Số điện thoại không khớp với đơn hàng hoặc đơn không tồn tại.");
  }

  await setOrderAccessCookie(code, order.customerPhone);
  return ok(true);
}

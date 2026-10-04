import { createHash } from "crypto";

const COOKIE_PREFIX = "order_auth_";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function hashPhoneForOrder(phone: string): string {
  // Normalize phone (strip +84, leading 0, spaces)
  const normalized = phone.replace(/\D/g, "").slice(-9);
  return createHash("sha256").update(`tuanlinh:${normalized}`).digest("hex");
}

export function getOrderCookieName(code: string): string {
  return `${COOKIE_PREFIX}${code.toLowerCase()}`;
}

export async function setOrderAccessCookie(code: string, phone: string) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const hash = hashPhoneForOrder(phone);

    cookieStore.set(getOrderCookieName(code), hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
  } catch {
    // Non-fatal if headers/cookies cannot be set in current context (e.g. test)
  }
}

export function isOrderAccessAuthorized(
  code: string,
  customerPhone: string,
  cookieValue?: string,
): boolean {
  if (!cookieValue) return false;
  const expectedHash = hashPhoneForOrder(customerPhone);
  return cookieValue === expectedHash;
}

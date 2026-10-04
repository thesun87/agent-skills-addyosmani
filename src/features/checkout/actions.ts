"use server";

import { db } from "@/lib/db";
import { type Result, ok, err } from "@/lib/result";
import { calculateTotals, type PricedLine } from "@/lib/pricing";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateOrderCode } from "@/features/orders/order-code";
import { getShopSettings, isShopOpen } from "@/features/settings/queries";
import { setOrderAccessCookie } from "@/features/orders/auth";
import { placeOrderSchema } from "./schema";

class BusinessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function parsePickupAt(value: string | undefined): Date | null {
  if (!value) return null;
  if (value === "earliest") {
    return new Date(Date.now() + 15 * 60 * 1000);
  }
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    const now = new Date();
    const utcNow = now.getTime();
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    const vnDate = new Date(utcNow + vnOffsetMs);
    const year = vnDate.getUTCFullYear();
    const month = vnDate.getUTCMonth();
    const date = vnDate.getUTCDate();
    const pickupMs = Date.UTC(year, month, date, hours - 7, minutes);
    return new Date(pickupMs);
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return new Date(Date.now() + 15 * 60 * 1000);
}

/**
 * Server action to create an order (C5, C7, C9-API).
 * Re-derives all prices and options from the DB; client-sent prices are strictly ignored.
 */
export async function placeOrder(
  input: unknown,
  clientIpOverride?: string,
): Promise<Result<{ code: string }>> {
  // 1. Resolve client IP for rate limiting
  let ip = clientIpOverride;
  if (!ip) {
    try {
      const { headers } = await import("next/headers");
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    } catch {
      ip = "127.0.0.1";
    }
  }

  // 2. Validate input schema with Zod
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return err("INVALID_INPUT", "Thông tin đặt hàng không hợp lệ", parsed.error.flatten());
  }

  // 3. Check shop opening hours
  const settings = await getShopSettings();
  if (!isShopOpen(settings)) {
    return err("SHOP_CLOSED", `Quán đang đóng cửa, mở lại lúc ${settings.openTime}`);
  }

  // 4. Check Postgres sliding-window rate limit (5 orders / 10 mins per IP, AD4)
  const rateLimit = await checkRateLimit(`order:${ip}`, 5, 600);
  if (!rateLimit.allowed) {
    return err(
      "RATE_LIMITED",
      "Bạn đã đặt quá nhiều đơn trong thời gian ngắn. Vui lòng thử lại sau 10 phút.",
    );
  }

  // 5. In transaction: re-derive price, snapshot items, generate order code, and create order
  try {
    return await db.$transaction(async (tx) => {
      const preparedItems = [];
      const pricedLines: PricedLine[] = [];

      for (const item of parsed.data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            optionGroups: {
              include: { options: true },
            },
          },
        });

        if (!product || product.isArchived || !product.isAvailable) {
          throw new BusinessError(
            "ITEM_UNAVAILABLE",
            `Món "${product?.name ?? "Đã chọn"}" tạm hết hàng hoặc không khả dụng. Vui lòng kiểm tra lại giỏ hàng.`,
          );
        }

        const selectedOptions = [];
        let optionPriceSum = 0;

        for (const optId of item.optionIds) {
          let foundOpt = null;
          for (const grp of product.optionGroups) {
            const match = grp.options.find((o) => o.id === optId);
            if (match) {
              foundOpt = match;
              break;
            }
          }

          if (!foundOpt) {
            throw new BusinessError(
              "ITEM_UNAVAILABLE",
              `Tuỳ chọn của món "${product.name}" không tồn tại hoặc đã thay đổi.`,
            );
          }

          selectedOptions.push({
            id: foundOpt.id,
            name: foundOpt.name,
            priceDelta: foundOpt.priceDelta,
          });
          optionPriceSum += foundOpt.priceDelta;
        }

        const unitPrice = product.basePrice + optionPriceSum;
        const lineTotal = unitPrice * item.quantity;

        pricedLines.push({ unitPrice, quantity: item.quantity });

        preparedItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.imageUrl,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
          selectedOptions: JSON.stringify(selectedOptions),
          note: item.note,
        });
      }

      // Re-derive totals from DB
      const totals = calculateTotals(pricedLines, parsed.data.fulfillment, settings);

      // Generate unique code (loop up to 5 times in case of collision)
      let code = generateOrderCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.order.findUnique({ where: { code } });
        if (!existing) break;
        code = generateOrderCode();
        attempts++;
      }

      const order = await tx.order.create({
        data: {
          code,
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentMethod: parsed.data.paymentMethod,
          fulfillment: parsed.data.fulfillment,
          customerName: parsed.data.customerName,
          customerPhone: parsed.data.customerPhone,
          deliveryAddress: parsed.data.deliveryAddress,
          pickupAt:
            parsed.data.fulfillment === "PICKUP" ? parsePickupAt(parsed.data.pickupAt) : null,
          note: parsed.data.note,
          subtotal: totals.subtotal,
          shippingFee: totals.shippingFee,
          total: totals.total,
          items: {
            create: preparedItems,
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "PENDING",
              note: "Khách đặt hàng",
            },
          },
        },
      });

      await setOrderAccessCookie(order.code, parsed.data.customerPhone);

      return ok({ code: order.code });
    });
  } catch (error) {
    if (error instanceof BusinessError) {
      return err(error.code, error.message);
    }
    throw error;
  }
}

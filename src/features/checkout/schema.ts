import { z } from "zod";
import { cartLineSchema } from "@/features/cart/schema";

export const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const placeOrderSchema = z
  .object({
    fulfillment: z.enum(["DELIVERY", "PICKUP"], {
      message: "Vui lòng chọn hình thức nhận hàng",
    }),
    customerName: z
      .string()
      .trim()
      .min(2, "Vui lòng nhập họ và tên (tối thiểu 2 ký tự)")
      .max(100, "Tên quá dài (tối đa 100 ký tự)"),
    customerPhone: z
      .string()
      .trim()
      .regex(VIETNAMESE_PHONE_REGEX, "Số điện thoại không hợp lệ (10 chữ số)"),
    paymentMethod: z.enum(["COD", "BANK_TRANSFER"], {
      message: "Vui lòng chọn phương thức thanh toán",
    }),
    deliveryAddress: z.string().trim().optional(),
    pickupAt: z.string().optional(),
    note: z.string().trim().max(200, "Ghi chú tối đa 200 ký tự").optional(),
    items: z.array(cartLineSchema).min(1, "Giỏ hàng phải có ít nhất 1 món"),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "DELIVERY") {
      if (!data.deliveryAddress || data.deliveryAddress.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng nhập địa chỉ giao hàng cụ thể",
          path: ["deliveryAddress"],
        });
      }
    } else if (data.fulfillment === "PICKUP") {
      if (!data.pickupAt || data.pickupAt.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng chọn thời gian lấy món",
          path: ["pickupAt"],
        });
      }
    }
  });

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

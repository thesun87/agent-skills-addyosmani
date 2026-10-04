import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().min(1, "Thiếu mã sản phẩm"),
  optionIds: z.array(z.string()).default([]),
  quantity: z
    .number()
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng tối thiểu là 1")
    .max(50, "Số lượng tối đa là 50"),
  note: z.string().max(200, "Ghi chú không quá 200 ký tự").optional().default(""),
});

export type CartLineInput = z.infer<typeof cartLineSchema>;

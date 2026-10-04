import { z } from "zod";

export const shopSettingsSchema = z.object({
  id: z.string().default("default"),
  shopName: z.string().min(1).default("Tuấn Linh Coffee"),
  address: z.string().min(1).default("123 Đường Cà Phê, Quận 1, TP. HCM"),
  phone: z.string().min(1).default("0987654321"),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("07:00"),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("22:00"),
  deliveryRadiusKm: z.number().int().positive().default(5),
  shippingFee: z.number().int().nonnegative().default(15000),
  freeShippingThreshold: z.number().int().nonnegative().default(150000),
  bankBin: z.string().default("970422"),
  bankAccountNo: z.string().default("0987654321"),
  bankAccountName: z.string().default("TUAN LINH COFFEE"),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;

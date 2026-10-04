import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "./helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import {
  createOptionGroupAction,
  updateOptionGroupAction,
  deleteOptionGroupAction,
  getAdminOptionGroups,
} from "@/features/menu/admin-actions/option-groups";

// Mock requireAdmin to return seeded admin
vi.mock("@/features/auth/require-admin", () => ({
  requireAdmin: vi.fn(async () => {
    const admin = await db.adminUser.findFirst();
    if (!admin) throw new Error("No admin");
    return { id: admin.id, email: admin.email, name: admin.name };
  }),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Admin Option Groups (T14, A3, AD10)", () => {
  beforeEach(async () => {
    await resetDb();
    await seedAdminUser();
  });

  it("creates option group with nested options", async () => {
    const res = await createOptionGroupAction({
      name: "Chọn Size",
      isRequired: true,
      maxSelect: 1,
      options: [
        { name: "Size M (Vừa)", priceDelta: 0, sortOrder: 1 },
        { name: "Size L (Lớn)", priceDelta: 6000, sortOrder: 2 },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.group).toBeDefined();
    expect(res.group?.name).toBe("Chọn Size");
    expect(res.group?.isRequired).toBe(true);
    expect(res.group?.maxSelect).toBe(1);

    const fromDb = await db.optionGroup.findUnique({
      where: { id: res.group?.id },
      include: { options: true },
    });
    expect(fromDb).not.toBeNull();
    expect(fromDb?.options.length).toBe(2);
    expect(fromDb?.options.find((o) => o.name.includes("Size L"))?.priceDelta).toBe(6000);
  });

  it("rejects option group with 0 options, negative price, or invalid maxSelect", async () => {
    // 0 options
    const noOptRes = await createOptionGroupAction({
      name: "Topping",
      isRequired: false,
      maxSelect: 1,
      options: [],
    });
    expect(noOptRes.success).toBe(false);
    expect(noOptRes.error).toBe("Nhóm tuỳ chọn phải có ít nhất 1 tuỳ chọn.");

    // Negative price
    const negPriceRes = await createOptionGroupAction({
      name: "Topping",
      isRequired: false,
      maxSelect: 1,
      options: [{ name: "Trân châu", priceDelta: -2000 }],
    });
    expect(negPriceRes.success).toBe(false);
    expect(negPriceRes.error).toBe("Giá phụ thu phải là số nguyên ≥ 0.");

    // maxSelect > options.length
    const badMaxSelectRes = await createOptionGroupAction({
      name: "Topping",
      isRequired: false,
      maxSelect: 3,
      options: [{ name: "Trân châu", priceDelta: 5000 }],
    });
    expect(badMaxSelectRes.success).toBe(false);
    expect(badMaxSelectRes.error).toBe("Chọn tối đa 3 nhưng nhóm chỉ có 1 tuỳ chọn.");
  });

  it("updates option group name, rules, and options", async () => {
    const group = await db.optionGroup.create({
      data: {
        name: "Lượng đường",
        isRequired: false,
        maxSelect: 1,
        options: {
          create: [{ name: "100% đường", priceDelta: 0 }],
        },
      },
    });

    const res = await updateOptionGroupAction(group.id, {
      name: "Mức đường",
      isRequired: true,
      maxSelect: 1,
      options: [
        { name: "100% đường (Bình thường)", priceDelta: 0 },
        { name: "50% đường (Ít ngọt)", priceDelta: 0 },
      ],
    });

    expect(res.success).toBe(true);
    const updated = await db.optionGroup.findUnique({
      where: { id: group.id },
      include: { options: true },
    });
    expect(updated?.name).toBe("Mức đường");
    expect(updated?.isRequired).toBe(true);
    expect(updated?.options.length).toBe(2);
  });

  it("deleting option group unlinks it from products and cascades options without breaking orders", async () => {
    const cat = await db.category.create({ data: { name: "Cà phê", sortOrder: 1 } });
    const group = await db.optionGroup.create({
      data: {
        name: "Topping",
        isRequired: false,
        maxSelect: 2,
        options: {
          create: [{ name: "Thạch cafe", priceDelta: 5000 }],
        },
      },
    });

    const prod = await db.product.create({
      data: {
        name: "Cà phê sữa",
        basePrice: 30000,
        categoryId: cat.id,
        optionGroups: {
          connect: [{ id: group.id }],
        },
      },
    });

    // An order existing with snapshot options
    const order = await db.order.create({
      data: {
        code: "CF-261004-8888",
        customerName: "Khách test",
        customerPhone: "0909090909",
        fulfillment: "DELIVERY",
        paymentMethod: "COD",
        subtotal: 35000,
        shippingFee: 15000,
        total: 50000,
      },
    });
    await db.orderItem.create({
      data: {
        orderId: order.id,
        productId: prod.id,
        productName: prod.name,
        unitPrice: 35000,
        quantity: 1,
        lineTotal: 35000,
        selectedOptions: [{ id: "opt-1", name: "Thạch cafe", priceDelta: 5000 }],
      },
    });

    // Delete option group
    const res = await deleteOptionGroupAction(group.id);
    expect(res.success).toBe(true);

    // Group is deleted
    const groupFromDb = await db.optionGroup.findUnique({ where: { id: group.id } });
    expect(groupFromDb).toBeNull();

    // Product still exists and has 0 optionGroups
    const prodFromDb = await db.product.findUnique({
      where: { id: prod.id },
      include: { optionGroups: true },
    });
    expect(prodFromDb).not.toBeNull();
    expect(prodFromDb?.optionGroups.length).toBe(0);

    // Order snapshot is completely preserved
    const orderFromDb = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    expect(orderFromDb?.items[0].selectedOptions).toBeDefined();
  });

  it("lists all groups with product counts via getAdminOptionGroups", async () => {
    const cat = await db.category.create({ data: { name: "Cà phê", sortOrder: 1 } });
    const group = await db.optionGroup.create({
      data: {
        name: "Lượng đá",
        isRequired: true,
        maxSelect: 1,
        options: {
          create: [{ name: "100% đá", priceDelta: 0 }],
        },
      },
    });

    await db.product.create({
      data: {
        name: "Cold brew",
        basePrice: 45000,
        categoryId: cat.id,
        optionGroups: {
          connect: [{ id: group.id }],
        },
      },
    });

    const groups = await getAdminOptionGroups();
    const found = groups.find((g) => g.id === group.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Lượng đá");
    expect(found?._count.products).toBe(1);
    expect(found?.options.length).toBe(1);
  });
});

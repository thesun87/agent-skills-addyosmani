import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "./helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import {
  createProductAction,
  updateProductAction,
  toggleProductAvailabilityAction,
  archiveProductAction,
  deleteProductAction,
  getAdminProducts,
} from "@/features/menu/admin-actions/products";

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

describe("Admin Products CRUD & Availability (T14, A3)", () => {
  let categoryId: string;
  let optionGroupId: string;

  beforeEach(async () => {
    await resetDb();
    await seedAdminUser();

    const cat = await db.category.create({
      data: { name: "Cà phê", sortOrder: 1 },
    });
    categoryId = cat.id;

    const group = await db.optionGroup.create({
      data: {
        name: "Size",
        isRequired: true,
        maxSelect: 1,
        sortOrder: 1,
        options: {
          create: [
            { name: "Size M", priceDelta: 0, sortOrder: 1 },
            { name: "Size L", priceDelta: 5000, sortOrder: 2 },
          ],
        },
      },
    });
    optionGroupId = group.id;
  });

  it("creates a new product attached to category and option groups", async () => {
    const res = await createProductAction({
      name: "Bạc xỉu",
      categoryId,
      basePrice: 35000,
      description: "Cà phê nhiều sữa béo ngậy",
      optionGroupIds: [optionGroupId],
    });

    expect(res.success).toBe(true);
    expect(res.product).toBeDefined();
    expect(res.product?.name).toBe("Bạc xỉu");
    expect(res.product?.basePrice).toBe(35000);
    expect(res.product?.isAvailable).toBe(true);
    expect(res.product?.isArchived).toBe(false);

    const fromDb = await db.product.findUnique({
      where: { id: res.product?.id },
      include: { optionGroups: true },
    });
    expect(fromDb).not.toBeNull();
    expect(fromDb?.optionGroups.length).toBe(1);
    expect(fromDb?.optionGroups[0].id).toBe(optionGroupId);
  });

  it("rejects product with negative price or empty name", async () => {
    const badNameRes = await createProductAction({
      name: "  ",
      categoryId,
      basePrice: 30000,
    });
    expect(badNameRes.success).toBe(false);

    const badPriceRes = await createProductAction({
      name: "Cà phê đen",
      categoryId,
      basePrice: -5000,
    });
    expect(badPriceRes.success).toBe(false);
  });

  it("toggles product availability (hết hàng một chạm)", async () => {
    const prod = await db.product.create({
      data: {
        name: "Cà phê muối",
        basePrice: 40000,
        categoryId,
        isAvailable: true,
      },
    });

    const res = await toggleProductAvailabilityAction(prod.id, false);
    expect(res.success).toBe(true);

    const updated = await db.product.findUnique({ where: { id: prod.id } });
    expect(updated?.isAvailable).toBe(false);

    // Toggle back
    const res2 = await toggleProductAvailabilityAction(prod.id, true);
    expect(res2.success).toBe(true);
    const updated2 = await db.product.findUnique({ where: { id: prod.id } });
    expect(updated2?.isAvailable).toBe(true);
  });

  it("updates product details and links/unlinks option groups", async () => {
    const prod = await db.product.create({
      data: {
        name: "Trà đào",
        basePrice: 40000,
        categoryId,
        optionGroups: {
          connect: [{ id: optionGroupId }],
        },
      },
    });

    const res = await updateProductAction(prod.id, {
      name: "Trà đào cam sả",
      basePrice: 45000,
      description: "Thơm mùi sả tươi",
      optionGroupIds: [], // unlink option group
    });

    expect(res.success).toBe(true);
    const updated = await db.product.findUnique({
      where: { id: prod.id },
      include: { optionGroups: true },
    });
    expect(updated?.name).toBe("Trà đào cam sả");
    expect(updated?.basePrice).toBe(45000);
    expect(updated?.optionGroups.length).toBe(0);
  });

  it("archives product when requested (isArchived = true)", async () => {
    const prod = await db.product.create({
      data: {
        name: "Món mùa đông",
        basePrice: 45000,
        categoryId,
      },
    });

    const res = await archiveProductAction(prod.id);
    expect(res.success).toBe(true);

    const updated = await db.product.findUnique({ where: { id: prod.id } });
    expect(updated?.isArchived).toBe(true);
  });

  it("safely archives product instead of hard delete when product has orders", async () => {
    const prod = await db.product.create({
      data: {
        name: "Cà phê phin truyền thống",
        basePrice: 25000,
        categoryId,
      },
    });

    const order = await db.order.create({
      data: {
        code: "CF-261004-9999",
        customerName: "Khách VIP",
        customerPhone: "0911222333",
        fulfillment: "PICKUP",
        paymentMethod: "COD",
        subtotal: 25000,
        shippingFee: 0,
        total: 25000,
      },
    });

    await db.orderItem.create({
      data: {
        orderId: order.id,
        productId: prod.id,
        productName: prod.name,
        unitPrice: prod.basePrice,
        quantity: 1,
        lineTotal: 25000,
      },
    });

    // Delete product that has an order item
    const res = await deleteProductAction(prod.id);
    expect(res.success).toBe(true);
    expect(res.isArchived).toBe(true);

    // Product still exists in DB but is archived
    const fromDb = await db.product.findUnique({ where: { id: prod.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb?.isArchived).toBe(true);

    // Order item is preserved
    const orderItems = await db.orderItem.findMany({ where: { orderId: order.id } });
    expect(orderItems.length).toBe(1);
    expect(orderItems[0].productName).toBe("Cà phê phin truyền thống");
  });

  it("hard deletes product when it has never appeared in orders", async () => {
    const prod = await db.product.create({
      data: {
        name: "Món thử nghiệm",
        basePrice: 50000,
        categoryId,
      },
    });

    const res = await deleteProductAction(prod.id);
    expect(res.success).toBe(true);
    expect(res.isArchived).toBe(false);

    const fromDb = await db.product.findUnique({ where: { id: prod.id } });
    expect(fromDb).toBeNull();
  });

  it("lists products via getAdminProducts", async () => {
    await db.product.create({
      data: {
        name: "Latte đá",
        basePrice: 42000,
        categoryId,
      },
    });

    const products = await getAdminProducts();
    expect(products.length).toBeGreaterThanOrEqual(1);
    expect(products.some((p) => p.name === "Latte đá")).toBe(true);
  });
});

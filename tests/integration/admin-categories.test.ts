import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "./helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import {
  createCategoryAction,
  updateCategoryAction,
  reorderCategoryAction,
  deleteCategoryAction,
  getAdminCategories,
} from "@/features/menu/admin-actions/categories";

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

describe("Admin Categories (T13, A2)", () => {
  beforeEach(async () => {
    await resetDb();
    await seedAdminUser();
  });

  it("creates a new category with proper sortOrder and visibility", async () => {
    const res = await createCategoryAction({
      name: "Cà phê Việt",
      sortOrder: 1,
      isVisible: true,
    });

    expect(res.success).toBe(true);
    expect(res.category).toBeDefined();
    expect(res.category?.name).toBe("Cà phê Việt");
    expect(res.category?.sortOrder).toBe(1);
    expect(res.category?.isVisible).toBe(true);

    const categoryId = res.category?.id;
    expect(categoryId).toBeDefined();
    if (!categoryId) throw new Error("No category ID");

    const fromDb = await db.category.findUnique({
      where: { id: categoryId },
    });
    expect(fromDb).not.toBeNull();
    expect(fromDb?.name).toBe("Cà phê Việt");
  });

  it("rejects creating category with empty name", async () => {
    const res = await createCategoryAction({
      name: "   ",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("updates category name, sortOrder and visibility", async () => {
    const cat = await db.category.create({
      data: {
        name: "Trà",
        sortOrder: 1,
        isVisible: true,
      },
    });

    const res = await updateCategoryAction(cat.id, {
      name: "Trà hoa quả",
      sortOrder: 5,
      isVisible: false,
    });

    expect(res.success).toBe(true);
    const updated = await db.category.findUnique({ where: { id: cat.id } });
    expect(updated?.name).toBe("Trà hoa quả");
    expect(updated?.sortOrder).toBe(5);
    expect(updated?.isVisible).toBe(false);
  });

  it("reorders category up and down", async () => {
    const cat1 = await db.category.create({
      data: { name: "Cat 1", sortOrder: 1 },
    });
    const cat2 = await db.category.create({
      data: { name: "Cat 2", sortOrder: 2 },
    });

    // Move cat2 up (swap with cat1)
    const resUp = await reorderCategoryAction(cat2.id, "up");
    expect(resUp.success).toBe(true);

    const updatedCat1 = await db.category.findUnique({ where: { id: cat1.id } });
    const updatedCat2 = await db.category.findUnique({ where: { id: cat2.id } });

    expect(updatedCat1).not.toBeNull();
    expect(updatedCat2).not.toBeNull();
    if (!updatedCat1 || !updatedCat2) throw new Error("Categories not found");
    expect(updatedCat2.sortOrder).toBeLessThan(updatedCat1.sortOrder);

    // Move cat2 back down
    const resDown = await reorderCategoryAction(cat2.id, "down");
    expect(resDown.success).toBe(true);

    const reorderedCat1 = await db.category.findUnique({ where: { id: cat1.id } });
    const reorderedCat2 = await db.category.findUnique({ where: { id: cat2.id } });
    expect(reorderedCat1).not.toBeNull();
    expect(reorderedCat2).not.toBeNull();
    if (!reorderedCat1 || !reorderedCat2) throw new Error("Categories not found");
    expect(reorderedCat1.sortOrder).toBeLessThan(reorderedCat2.sortOrder);
  });

  it("prevents deleting category that still has products with exact SPEC message", async () => {
    const cat = await db.category.create({
      data: {
        name: "Cà phê máy",
        sortOrder: 1,
      },
    });

    // Create 2 products in this category
    await db.product.create({
      data: {
        name: "Espresso",
        basePrice: 30000,
        categoryId: cat.id,
      },
    });
    await db.product.create({
      data: {
        name: "Americano",
        basePrice: 35000,
        categoryId: cat.id,
      },
    });

    const res = await deleteCategoryAction(cat.id);
    expect(res.success).toBe(false);
    expect(res.error).toBe(
      `Không thể xoá danh mục "Cà phê máy" vì vẫn còn 2 món thuộc danh mục này theo quy tắc SPEC.`
    );

    // Ensure category still exists
    const stillExists = await db.category.findUnique({ where: { id: cat.id } });
    expect(stillExists).not.toBeNull();
  });

  it("deletes category successfully when it has no products", async () => {
    const cat = await db.category.create({
      data: {
        name: "Danh mục trống",
        sortOrder: 1,
      },
    });

    const res = await deleteCategoryAction(cat.id);
    expect(res.success).toBe(true);

    const deleted = await db.category.findUnique({ where: { id: cat.id } });
    expect(deleted).toBeNull();
  });

  it("returns categories with product counts via getAdminCategories", async () => {
    const cat = await db.category.create({
      data: {
        name: "Bánh ngọt",
        sortOrder: 3,
        isVisible: true,
      },
    });
    await db.product.create({
      data: {
        name: "Croissant",
        basePrice: 25000,
        categoryId: cat.id,
      },
    });

    const categories = await getAdminCategories();
    const found = categories.find((c) => c.id === cat.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Bánh ngọt");
    expect(found?._count.products).toBe(1);
  });
});

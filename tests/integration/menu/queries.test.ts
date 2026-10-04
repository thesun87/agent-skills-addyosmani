import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getVisibleMenu } from "@/features/menu/queries";
import { resetDb } from "../helpers/reset-db";

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe("getVisibleMenu", () => {
  it("returns visible categories and unarchived products ordered by sortOrder", async () => {
    const cat1 = await db.category.create({
      data: { name: "Cà phê Việt", sortOrder: 1, isVisible: true },
    });
    const cat2 = await db.category.create({
      data: { name: "Trà", sortOrder: 0, isVisible: true },
    });
    await db.category.create({
      data: { name: "Danh mục ẩn", sortOrder: 2, isVisible: false },
    });

    // Products in cat1
    await db.product.create({
      data: {
        categoryId: cat1.id,
        name: "Cà phê đen đá",
        basePrice: 25_000,
        sortOrder: 1,
      },
    });
    await db.product.create({
      data: {
        categoryId: cat1.id,
        name: "Cà phê sữa đá",
        basePrice: 29_000,
        sortOrder: 0,
      },
    });
    // Archived product - should be excluded
    await db.product.create({
      data: {
        categoryId: cat1.id,
        name: "Cà phê cũ ngừng bán",
        basePrice: 20_000,
        isArchived: true,
      },
    });

    // Unavailable product in cat2 - should be included but isAvailable = false
    await db.product.create({
      data: {
        categoryId: cat2.id,
        name: "Trà sen vàng",
        basePrice: 42_000,
        isAvailable: false,
        sortOrder: 0,
      },
    });

    const menu = await getVisibleMenu();

    expect(menu.map((c) => c.name)).toEqual(["Trà", "Cà phê Việt"]);
    expect(menu[0]?.products.map((p) => [p.name, p.isAvailable])).toEqual([
      ["Trà sen vàng", false],
    ]);
    expect(menu[1]?.products.map((p) => p.name)).toEqual(["Cà phê sữa đá", "Cà phê đen đá"]);
  });
});

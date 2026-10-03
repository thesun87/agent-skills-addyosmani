import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "./helpers/reset-db";

beforeEach(resetDb);
afterAll(() => db.$disconnect());

async function createDrink() {
  const category = await db.category.create({ data: { name: "Cà phê Việt", sortOrder: 1 } });
  return db.product.create({
    data: {
      categoryId: category.id,
      name: "Cà phê sữa đá",
      basePrice: 29_000,
      optionGroups: {
        create: [
          {
            name: "Size",
            isRequired: true,
            maxSelect: 1,
            sortOrder: 1,
            options: {
              create: [
                { name: "M", priceDelta: 0, sortOrder: 1 },
                { name: "L", priceDelta: 6_000, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
    include: { optionGroups: { include: { options: { orderBy: { sortOrder: "asc" } } } } },
  });
}

describe("catalog schema", () => {
  it("stores a product with option groups and sensible defaults", async () => {
    const product = await createDrink();

    expect(product).toMatchObject({
      name: "Cà phê sữa đá",
      basePrice: 29_000,
      description: "",
      imageUrl: null,
      isAvailable: true,
      isArchived: false,
    });
    expect(product.optionGroups[0]?.options.map((o) => [o.name, o.priceDelta])).toEqual([
      ["M", 0],
      ["L", 6_000],
    ]);
  });

  it("removes option groups and options when their product is deleted", async () => {
    const product = await createDrink();

    await db.product.delete({ where: { id: product.id } });

    expect(await db.optionGroup.count()).toBe(0);
    expect(await db.option.count()).toBe(0);
  });

  it("refuses to delete a category that still has products", async () => {
    const product = await createDrink();

    await expect(db.category.delete({ where: { id: product.categoryId } })).rejects.toThrow();
  });

  it("starts each test with an empty database", async () => {
    expect(await db.product.count()).toBe(0);
  });
});

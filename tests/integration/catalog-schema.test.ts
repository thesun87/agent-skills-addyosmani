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

  it("allows multiple products to share the same option group", async () => {
    const category = await db.category.create({ data: { name: "Cà phê Việt", sortOrder: 1 } });
    const group = await db.optionGroup.create({
      data: {
        name: "Size",
        isRequired: true,
        maxSelect: 1,
        options: {
          create: [
            { name: "M", priceDelta: 0 },
            { name: "L", priceDelta: 6_000 },
          ],
        },
      },
    });

    const drink1 = await db.product.create({
      data: {
        categoryId: category.id,
        name: "Cà phê đen",
        basePrice: 25_000,
        optionGroups: { connect: [{ id: group.id }] },
      },
      include: { optionGroups: true },
    });

    const drink2 = await db.product.create({
      data: {
        categoryId: category.id,
        name: "Cà phê sữa",
        basePrice: 29_000,
        optionGroups: { connect: [{ id: group.id }] },
      },
      include: { optionGroups: true },
    });

    expect(drink1.optionGroups).toHaveLength(1);
    expect(drink2.optionGroups).toHaveLength(1);
    expect(drink1.optionGroups[0]?.id).toBe(group.id);
    expect(drink2.optionGroups[0]?.id).toBe(group.id);
    expect(await db.optionGroup.count()).toBe(1);
  });

  it("unlinks option groups when a product is deleted without deleting the shared option group", async () => {
    const product = await createDrink();

    await db.product.delete({ where: { id: product.id } });

    // The shared option group and options still exist for other products
    expect(await db.optionGroup.count()).toBe(1);
    expect(await db.option.count()).toBe(2);
  });

  it("cascades deletion of options when an option group is deleted", async () => {
    const product = await createDrink();
    const [group] = product.optionGroups;
    expect(group).toBeDefined();

    await db.optionGroup.delete({ where: { id: group?.id } });

    expect(await db.optionGroup.count()).toBe(0);
    expect(await db.option.count()).toBe(0);

    const reloaded = await db.product.findUnique({
      where: { id: product.id },
      include: { optionGroups: true },
    });
    expect(reloaded?.optionGroups).toEqual([]);
  });

  it("refuses to delete a category that still has products", async () => {
    const product = await createDrink();

    await expect(db.category.delete({ where: { id: product.categoryId } })).rejects.toThrow();
  });

  it("starts each test with an empty database", async () => {
    expect(await db.product.count()).toBe(0);
  });
});

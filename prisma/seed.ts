import { PrismaClient } from "@prisma/client";
import { SEED_MENU, type SeedOptionGroup, type SeedProduct } from "./seed-data/menu";

const db = new PrismaClient();

function optionGroupsCreate(groups: readonly SeedOptionGroup[]) {
  return groups.map((group, groupIndex) => ({
    name: group.name,
    isRequired: group.isRequired,
    maxSelect: group.maxSelect,
    sortOrder: groupIndex,
    options: {
      create: group.options.map((option, optionIndex) => ({
        name: option.name,
        priceDelta: option.priceDelta ?? 0,
        sortOrder: optionIndex,
      })),
    },
  }));
}

async function seedProduct(categoryId: string, product: SeedProduct, sortOrder: number) {
  const fields = {
    categoryId,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    sortOrder,
  };

  // Option groups are not referenced by orders (orders keep a snapshot), so they are rebuilt on each run.
  await db.$transaction([
    db.product.upsert({
      where: { id: product.id },
      create: { id: product.id, ...fields },
      update: fields,
    }),
    db.optionGroup.deleteMany({ where: { productId: product.id } }),
    db.product.update({
      where: { id: product.id },
      data: { optionGroups: { create: optionGroupsCreate(product.optionGroups) } },
    }),
  ]);
}

async function main() {
  for (const [categoryIndex, category] of SEED_MENU.entries()) {
    const fields = { name: category.name, sortOrder: categoryIndex };
    await db.category.upsert({
      where: { id: category.id },
      create: { id: category.id, ...fields },
      update: fields,
    });

    for (const [productIndex, product] of category.products.entries()) {
      await seedProduct(category.id, product, productIndex);
    }
  }

  const productCount = SEED_MENU.reduce((sum, c) => sum + c.products.length, 0);
  console.info(`Seeded ${SEED_MENU.length} categories, ${productCount} products.`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

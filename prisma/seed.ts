import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_MENU, SEED_OPTION_GROUPS, type SeedProduct } from "./seed-data/menu";

const db = new PrismaClient();

async function seedSharedOptionGroups() {
  for (const [groupIndex, group] of Object.values(SEED_OPTION_GROUPS).entries()) {
    await db.optionGroup.upsert({
      where: { id: group.id },
      create: {
        id: group.id,
        name: group.name,
        isRequired: group.isRequired,
        maxSelect: group.maxSelect,
        sortOrder: groupIndex,
      },
      update: {
        name: group.name,
        isRequired: group.isRequired,
        maxSelect: group.maxSelect,
        sortOrder: groupIndex,
      },
    });

    // Re-sync options under this group
    await db.option.deleteMany({ where: { groupId: group.id } });
    await db.option.createMany({
      data: group.options.map((option, optionIndex) => ({
        groupId: group.id,
        name: option.name,
        priceDelta:
          "priceDelta" in option && typeof option.priceDelta === "number" ? option.priceDelta : 0,
        sortOrder: optionIndex,
      })),
    });
  }
}

async function seedProduct(categoryId: string, product: SeedProduct, sortOrder: number) {
  const fields = {
    categoryId,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    sortOrder,
  };

  await db.product.upsert({
    where: { id: product.id },
    create: {
      id: product.id,
      ...fields,
      optionGroups: {
        connect: product.optionGroups.map((g) => ({ id: g.id })),
      },
    },
    update: {
      ...fields,
      optionGroups: {
        set: product.optionGroups.map((g) => ({ id: g.id })),
      },
    },
  });
}

async function main() {
  await seedSharedOptionGroups();

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

  // Seed default shop settings (07:00 - 22:00, ship 15k, free threshold 150k, 5km)
  await db.shopSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      shopName: "Tuấn Linh Coffee",
      address: "123 Đường Cà Phê, Quận 1, TP. HCM",
      phone: "0987654321",
      openTime: "07:00",
      closeTime: "22:00",
      deliveryRadiusKm: 5,
      shippingFee: 15000,
      freeShippingThreshold: 150000,
      bankBin: "970422",
      bankAccountNo: "0987654321",
      bankAccountName: "TUAN LINH COFFEE",
    },
    update: {
      openTime: "07:00",
      closeTime: "22:00",
      deliveryRadiusKm: 5,
      shippingFee: 15000,
      freeShippingThreshold: 150000,
    },
  });

  // Seed default admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@tuanlinh.coffee";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!@";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await db.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Thu Ngân Quầy 1",
      passwordHash,
    },
    update: {},
  });

  const productCount = SEED_MENU.reduce((sum, c) => sum + c.products.length, 0);
  console.info(
    `Seeded ${SEED_MENU.length} categories, ${productCount} products, ShopSettings, and AdminUser.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

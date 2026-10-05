import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { uploadImage } from "../src/lib/storage";
import { SEED_MENU, SEED_OPTION_GROUPS, type SeedProduct } from "./seed-data/menu";

const db = new PrismaClient();

async function seedSharedOptionGroups(client: PrismaClient = db) {
  for (const [groupIndex, group] of Object.values(SEED_OPTION_GROUPS).entries()) {
    await client.optionGroup.upsert({
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
    await client.option.deleteMany({ where: { groupId: group.id } });
    await client.option.createMany({
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

async function seedProduct(
  client: PrismaClient = db,
  categoryId: string,
  product: SeedProduct,
  sortOrder: number,
) {
  let imageKey: string | undefined = undefined;

  if (product.imageFile) {
    const imagePath = path.resolve(__dirname, "seed-images", product.imageFile);
    if (fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      const key = `products/${product.id}.webp`;
      try {
        await uploadImage(key, buffer, "image/webp");
        imageKey = key;
      } catch (err) {
        console.warn(`Could not upload seed image for ${product.id}:`, err);
      }
    }
  }

  const fields = {
    categoryId,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    sortOrder,
    ...(imageKey ? { imageKey } : {}),
  };

  await client.product.upsert({
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

export async function seedDatabase(client: PrismaClient = db) {
  await seedSharedOptionGroups(client);

  for (const [categoryIndex, category] of SEED_MENU.entries()) {
    const fields = { name: category.name, sortOrder: categoryIndex };
    await client.category.upsert({
      where: { id: category.id },
      create: { id: category.id, ...fields },
      update: fields,
    });

    for (const [productIndex, product] of category.products.entries()) {
      await seedProduct(client, category.id, product, productIndex);
    }
  }

  // Seed default shop settings (07:00 - 22:00, ship 15k, free threshold 150k, 5km)
  await client.shopSettings.upsert({
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
  await client.adminUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Thu Ngân Quầy 1",
      passwordHash,
    },
    update: {},
  });

  const productCount = SEED_MENU.reduce((sum, c) => sum + c.products.length, 0);
  return {
    categoryCount: SEED_MENU.length,
    productCount,
  };
}

async function main() {
  const result = await seedDatabase(db);
  console.info(
    `Seeded ${result.categoryCount} categories, ${result.productCount} products, ShopSettings, and AdminUser.`,
  );
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  main()
    .catch((error: unknown) => {
      console.error("Seed failed:", error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}

import { beforeAll, describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { SEED_MENU } from "../../../prisma/seed-data/menu";
import { seedDatabase } from "../../../prisma/seed";

describe("T18: Full Menu Seed, Images, and CREDITS", () => {
  beforeAll(async () => {
    await seedDatabase(db);
  });
  it("defines exactly 21 products across 6 categories in SEED_MENU", () => {
    expect(SEED_MENU).toHaveLength(6);
    const totalProducts = SEED_MENU.reduce((sum, c) => sum + c.products.length, 0);
    expect(totalProducts).toBe(21);
  });

  it("ensures all seed images are WebP and <= 150KB", () => {
    const seedImagesDir = path.resolve("prisma/seed-images");
    expect(fs.existsSync(seedImagesDir)).toBe(true);

    const files = fs.readdirSync(seedImagesDir).filter((f) => f.endsWith(".webp"));
    expect(files.length).toBe(21);

    for (const file of files) {
      const filePath = path.join(seedImagesDir, file);
      const stat = fs.statSync(filePath);
      const kb = stat.size / 1024;
      expect(kb, `${file} exceeds 150KB`).toBeLessThanOrEqual(150);
    }
  });

  it("ensures every image in prisma/seed-images has a corresponding entry in CREDITS.md", () => {
    const creditsPath = path.resolve("prisma/seed-images/CREDITS.md");
    expect(fs.existsSync(creditsPath)).toBe(true);

    const creditsContent = fs.readFileSync(creditsPath, "utf8");
    const seedImagesDir = path.resolve("prisma/seed-images");
    const files = fs.readdirSync(seedImagesDir).filter((f) => f.endsWith(".webp"));

    for (const file of files) {
      expect(
        creditsContent,
        `Missing entry for ${file} in CREDITS.md`,
      ).toContain(`\`${file}\``);
    }
  });

  it("verifies seeded database has all categories and products with images", async () => {
    const categories = await db.category.findMany({
      include: { products: true },
      orderBy: { sortOrder: "asc" },
    });

    expect(categories.length).toBeGreaterThanOrEqual(6);
    const allProducts = categories.flatMap((c) => c.products);
    expect(allProducts.length).toBeGreaterThanOrEqual(21);

    // Each seed product has an imageKey set
    const withImages = allProducts.filter((p) => p.imageKey !== null);
    expect(withImages.length).toBeGreaterThanOrEqual(21);
  });
});

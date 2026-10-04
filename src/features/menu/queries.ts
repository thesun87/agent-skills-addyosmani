import { db } from "@/lib/db";
import { publicUrl } from "@/lib/storage";

export async function getVisibleMenu() {
  const categories = await db.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isArchived: false },
        orderBy: { sortOrder: "asc" },
        include: {
          optionGroups: {
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return categories.map((cat) => ({
    ...cat,
    products: cat.products.map((p) => ({
      ...p,
      imageUrl: publicUrl(p.imageKey),
    })),
  }));
}

export type MenuCategory = Awaited<ReturnType<typeof getVisibleMenu>>[number];
export type MenuProduct = MenuCategory["products"][number];

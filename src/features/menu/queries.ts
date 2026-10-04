import { db } from "@/lib/db";

export async function getVisibleMenu() {
  return db.category.findMany({
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
}

export type MenuCategory = Awaited<ReturnType<typeof getVisibleMenu>>[number];
export type MenuProduct = MenuCategory["products"][number];

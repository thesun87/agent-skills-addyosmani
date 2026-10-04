"use server";

import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  category?: T;
}

export async function getAdminCategories() {
  await requireAdmin();
  return db.category.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export type AdminCategoryItem = Awaited<ReturnType<typeof getAdminCategories>>[number];

export async function createCategoryAction(input: {
  name: string;
  sortOrder?: number;
  isVisible?: boolean;
}): Promise<ActionResult<AdminCategoryItem>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const trimmedName = input.name?.trim();
  if (!trimmedName) {
    return { success: false, error: "Tên danh mục không được để trống." };
  }

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined || Number.isNaN(sortOrder)) {
    const last = await db.category.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? 0) + 1;
  }

  const category = await db.category.create({
    data: {
      name: trimmedName,
      sortOrder,
      isVisible: input.isVisible ?? true,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, category };
}

export async function updateCategoryAction(
  id: string,
  input: {
    name?: string;
    sortOrder?: number;
    isVisible?: boolean;
  }
): Promise<ActionResult<AdminCategoryItem>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const updateData: {
    name?: string;
    sortOrder?: number;
    isVisible?: boolean;
  } = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) {
      return { success: false, error: "Tên danh mục không được để trống." };
    }
    updateData.name = trimmed;
  }

  if (input.sortOrder !== undefined) {
    updateData.sortOrder = input.sortOrder;
  }

  if (input.isVisible !== undefined) {
    updateData.isVisible = input.isVisible;
  }

  const category = await db.category.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, category };
}

export async function reorderCategoryAction(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const allCategories = await db.category.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  const currentIndex = allCategories.findIndex((c) => c.id === id);
  if (currentIndex === -1) {
    return { success: false, error: "Danh mục không tồn tại." };
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= allCategories.length) {
    return { success: true }; // Already at edge
  }

  const currentCat = allCategories[currentIndex];
  const targetCat = allCategories[targetIndex];

  // Swap their sortOrder
  // In case they have the same sortOrder, ensure distinct sequential order
  let currentNewSort = targetCat.sortOrder;
  const targetNewSort = currentCat.sortOrder;
  if (currentNewSort === targetNewSort) {
    currentNewSort = direction === "up" ? targetCat.sortOrder - 1 : targetCat.sortOrder + 1;
  }

  await db.$transaction([
    db.category.update({
      where: { id: currentCat.id },
      data: { sortOrder: currentNewSort },
    }),
    db.category.update({
      where: { id: targetCat.id },
      data: { sortOrder: targetNewSort },
    }),
  ]);

  revalidatePath("/admin/danh-muc");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const category = await db.category.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true },
      },
    },
  });

  if (!category) {
    return { success: false, error: "Danh mục không tồn tại." };
  }

  if (category.products.length > 0) {
    return {
      success: false,
      error: `Không thể xoá danh mục "${category.name}" vì vẫn còn ${category.products.length} món thuộc danh mục này theo quy tắc SPEC.`,
    };
  }

  await db.category.delete({
    where: { id },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true };
}

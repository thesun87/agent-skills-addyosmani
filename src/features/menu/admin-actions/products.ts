"use server";

import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import { revalidatePath } from "next/cache";

export interface CreateProductInput {
  name: string;
  categoryId: string;
  basePrice: number;
  description?: string;
  sortOrder?: number;
  isAvailable?: boolean;
  imageKey?: string | null;
  optionGroupIds?: string[];
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  basePrice?: number;
  description?: string;
  sortOrder?: number;
  isAvailable?: boolean;
  imageKey?: string | null;
  optionGroupIds?: string[];
}

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  product?: T;
  isArchived?: boolean;
}

export async function getAdminProducts(categoryId?: string) {
  await requireAdmin();
  return db.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: [
      { category: { sortOrder: "asc" } },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      category: true,
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export type AdminProductItem = Awaited<ReturnType<typeof getAdminProducts>>[number];

export async function createProductAction(
  input: CreateProductInput
): Promise<ActionResult<AdminProductItem>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const name = input.name?.trim();
  if (!name) {
    return { success: false, error: "Tên món không được để trống." };
  }

  if (!input.categoryId) {
    return { success: false, error: "Vui lòng chọn danh mục cho món." };
  }

  const categoryExists = await db.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!categoryExists) {
    return { success: false, error: "Danh mục không tồn tại." };
  }

  if (!Number.isInteger(input.basePrice) || input.basePrice < 0) {
    return { success: false, error: "Giá bán phải là số nguyên ≥ 0." };
  }

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined || Number.isNaN(sortOrder)) {
    const last = await db.product.findFirst({
      where: { categoryId: input.categoryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? 0) + 1;
  }

  const product = await db.product.create({
    data: {
      name,
      categoryId: input.categoryId,
      basePrice: input.basePrice,
      description: input.description?.trim() || "",
      imageKey: input.imageKey ?? null,
      sortOrder,
      isAvailable: input.isAvailable ?? true,
      optionGroups: input.optionGroupIds && input.optionGroupIds.length > 0
        ? {
            connect: input.optionGroupIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: {
      category: true,
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, product };
}

export async function updateProductAction(
  id: string,
  input: UpdateProductInput
): Promise<ActionResult<AdminProductItem>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Món không tồn tại." };
  }

  const updateData: {
    name?: string;
    categoryId?: string;
    basePrice?: number;
    description?: string;
    imageKey?: string | null;
    sortOrder?: number;
    isAvailable?: boolean;
    optionGroups?: {
      set: { id: string }[];
    };
  } = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) {
      return { success: false, error: "Tên món không được để trống." };
    }
    updateData.name = trimmed;
  }

  if (input.categoryId !== undefined) {
    const categoryExists = await db.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!categoryExists) {
      return { success: false, error: "Danh mục không tồn tại." };
    }
    updateData.categoryId = input.categoryId;
  }

  if (input.basePrice !== undefined) {
    if (!Number.isInteger(input.basePrice) || input.basePrice < 0) {
      return { success: false, error: "Giá bán phải là số nguyên ≥ 0." };
    }
    updateData.basePrice = input.basePrice;
  }

  if (input.description !== undefined) {
    updateData.description = input.description.trim();
  }

  if (input.imageKey !== undefined) {
    updateData.imageKey = input.imageKey;
  }

  if (input.sortOrder !== undefined) {
    updateData.sortOrder = input.sortOrder;
  }

  if (input.isAvailable !== undefined) {
    updateData.isAvailable = input.isAvailable;
  }

  if (input.optionGroupIds !== undefined) {
    updateData.optionGroups = {
      set: input.optionGroupIds.map((grpId) => ({ id: grpId })),
    };
  }

  const product = await db.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, product };
}

export async function toggleProductAvailabilityAction(
  id: string,
  isAvailable: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  await db.product.update({
    where: { id },
    data: { isAvailable },
  });

  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true };
}

export async function archiveProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  await db.product.update({
    where: { id },
    data: { isArchived: true },
  });

  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, isArchived: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const orderCount = await db.orderItem.count({
    where: { productId: id },
  });

  if (orderCount > 0) {
    // Cannot hard-delete: archive instead to preserve order history
    await db.product.update({
      where: { id },
      data: { isArchived: true },
    });

    revalidatePath("/admin/mon");
    revalidatePath("/");
    revalidatePath("/(shop)");

    return { success: true, isArchived: true };
  }

  await db.product.delete({
    where: { id },
  });

  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, isArchived: false };
}

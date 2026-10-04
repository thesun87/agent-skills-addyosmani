"use server";

import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import { revalidatePath } from "next/cache";

export interface OptionItemInput {
  id?: string;
  name: string;
  priceDelta: number;
  sortOrder?: number;
}

export interface OptionGroupInput {
  name: string;
  isRequired?: boolean;
  maxSelect?: number;
  sortOrder?: number;
  options: OptionItemInput[];
}

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  group?: T;
}

export async function getAdminOptionGroups() {
  await requireAdmin();
  return db.optionGroup.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { products: true },
      },
    },
  });
}

export type AdminOptionGroupItem = Awaited<ReturnType<typeof getAdminOptionGroups>>[number];

export async function createOptionGroupAction(
  input: OptionGroupInput
): Promise<ActionResult<AdminOptionGroupItem>> {
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
    return { success: false, error: "Tên nhóm tuỳ chọn không được để trống." };
  }

  const options = input.options || [];
  if (options.length === 0) {
    return { success: false, error: "Nhóm tuỳ chọn phải có ít nhất 1 tuỳ chọn." };
  }

  for (const opt of options) {
    if (!opt.name?.trim()) {
      return { success: false, error: "Tên tuỳ chọn con không được để trống." };
    }
    if (!Number.isInteger(opt.priceDelta) || opt.priceDelta < 0) {
      return { success: false, error: "Giá phụ thu phải là số nguyên ≥ 0." };
    }
  }

  const maxSelect = input.maxSelect ?? 1;
  if (maxSelect < 1) {
    return { success: false, error: "Quy tắc chọn tối đa phải ≥ 1." };
  }
  if (maxSelect > options.length) {
    return {
      success: false,
      error: `Chọn tối đa ${maxSelect} nhưng nhóm chỉ có ${options.length} tuỳ chọn.`,
    };
  }

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined || Number.isNaN(sortOrder)) {
    const last = await db.optionGroup.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? 0) + 1;
  }

  const group = await db.optionGroup.create({
    data: {
      name,
      isRequired: input.isRequired ?? false,
      maxSelect,
      sortOrder,
      options: {
        create: options.map((opt, idx) => ({
          name: opt.name.trim(),
          priceDelta: opt.priceDelta,
          sortOrder: opt.sortOrder ?? idx + 1,
        })),
      },
    },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { products: true },
      },
    },
  });

  revalidatePath("/admin/tuy-chon");
  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, group };
}

export async function updateOptionGroupAction(
  id: string,
  input: {
    name?: string;
    isRequired?: boolean;
    maxSelect?: number;
    sortOrder?: number;
    options?: OptionItemInput[];
  }
): Promise<ActionResult<AdminOptionGroupItem>> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const existing = await db.optionGroup.findUnique({
    where: { id },
    include: { options: true },
  });
  if (!existing) {
    return { success: false, error: "Nhóm tuỳ chọn không tồn tại." };
  }

  const updateData: {
    name?: string;
    isRequired?: boolean;
    maxSelect?: number;
    sortOrder?: number;
  } = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) {
      return { success: false, error: "Tên nhóm tuỳ chọn không được để trống." };
    }
    updateData.name = trimmed;
  }

  if (input.isRequired !== undefined) {
    updateData.isRequired = input.isRequired;
  }

  if (input.sortOrder !== undefined) {
    updateData.sortOrder = input.sortOrder;
  }

  const options = input.options ?? existing.options;
  if (options.length === 0) {
    return { success: false, error: "Nhóm tuỳ chọn phải có ít nhất 1 tuỳ chọn." };
  }

  for (const opt of options) {
    if (!opt.name?.trim()) {
      return { success: false, error: "Tên tuỳ chọn con không được để trống." };
    }
    if (!Number.isInteger(opt.priceDelta) || opt.priceDelta < 0) {
      return { success: false, error: "Giá phụ thu phải là số nguyên ≥ 0." };
    }
  }

  const maxSelect = input.maxSelect ?? existing.maxSelect;
  if (maxSelect < 1) {
    return { success: false, error: "Quy tắc chọn tối đa phải ≥ 1." };
  }
  if (maxSelect > options.length) {
    return {
      success: false,
      error: `Chọn tối đa ${maxSelect} nhưng nhóm chỉ có ${options.length} tuỳ chọn.`,
    };
  }
  updateData.maxSelect = maxSelect;

  const group = await db.$transaction(async (tx) => {
    if (input.options) {
      // Re-create options
      await tx.option.deleteMany({ where: { groupId: id } });
      await tx.option.createMany({
        data: input.options.map((opt, idx) => ({
          groupId: id,
          name: opt.name.trim(),
          priceDelta: opt.priceDelta,
          sortOrder: opt.sortOrder ?? idx + 1,
        })),
      });
    }

    return tx.optionGroup.update({
      where: { id },
      data: updateData,
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { products: true },
        },
      },
    });
  });

  revalidatePath("/admin/tuy-chon");
  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true, group };
}

export async function deleteOptionGroupAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const existing = await db.optionGroup.findUnique({
    where: { id },
  });
  if (!existing) {
    return { success: false, error: "Nhóm tuỳ chọn không tồn tại." };
  }

  // Deleting the optionGroup automatically unlinks from products in Prisma implicit m:n
  // and cascade deletes options
  await db.optionGroup.delete({
    where: { id },
  });

  revalidatePath("/admin/tuy-chon");
  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true };
}

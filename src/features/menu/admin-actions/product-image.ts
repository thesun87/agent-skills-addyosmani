"use server";

import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import { uploadImage, deleteImage, publicUrl } from "@/lib/storage";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface UploadImageResult {
  success: boolean;
  error?: string;
  key?: string;
  url?: string | null;
}

export async function uploadProductImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { success: false, error: "Vui lòng chọn file ảnh." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Kích thước file ảnh không được vượt quá 2MB.",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Chỉ chấp nhận file ảnh định dạng JPEG, PNG hoặc WebP.",
    };
  }

  const productId = formData.get("productId") as string | null;
  const ext = EXTENSION_MAP[file.type] || "webp";
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const key = productId ? `products/${productId}-${uniqueSuffix}.${ext}` : `products/${uniqueSuffix}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If updating an existing product, find and delete its old image
    if (productId) {
      const existingProduct = await db.product.findUnique({
        where: { id: productId },
        select: { imageKey: true },
      });
      if (existingProduct?.imageKey) {
        try {
          await deleteImage(existingProduct.imageKey);
        } catch {
          // Ignore delete failure for old image
        }
      }
    }

    const storedKey = await uploadImage(key, buffer, file.type);

    if (productId) {
      await db.product.update({
        where: { id: productId },
        data: { imageKey: storedKey },
      });
    }

    revalidatePath("/admin/mon");
    revalidatePath("/");
    revalidatePath("/(shop)");

    return {
      success: true,
      key: storedKey,
      url: publicUrl(storedKey),
    };
  } catch (error) {
    console.error("uploadProductImageAction error:", error);
    return {
      success: false,
      error: "Tải ảnh lên thất bại. Vui lòng thử lại sau.",
    };
  }
}

export async function deleteProductImageAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi xác thực." };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { imageKey: true },
  });

  if (!product) {
    return { success: false, error: "Món không tồn tại." };
  }

  if (product.imageKey) {
    await deleteImage(product.imageKey);
    await db.product.update({
      where: { id: productId },
      data: { imageKey: null },
    });
  }

  revalidatePath("/admin/mon");
  revalidatePath("/");
  revalidatePath("/(shop)");

  return { success: true };
}

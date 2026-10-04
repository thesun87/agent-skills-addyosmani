import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetDb } from "./helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import {
  uploadProductImageAction,
  deleteProductImageAction,
} from "@/features/menu/admin-actions/product-image";
import * as storage from "@/lib/storage";

// Mock requireAdmin to return seeded admin
vi.mock("@/features/auth/require-admin", () => ({
  requireAdmin: vi.fn(async () => {
    const admin = await db.adminUser.findFirst();
    if (!admin) throw new Error("No admin");
    return { id: admin.id, email: admin.email, name: admin.name };
  }),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Product Image S3 Upload & Storage (T15, A3, AD8)", () => {
  let categoryId: string;

  beforeEach(async () => {
    await resetDb();
    await seedAdminUser();

    const cat = await db.category.create({
      data: { name: "Cà phê", sortOrder: 1 },
    });
    categoryId = cat.id;
  });

  it("rejects file larger than 2MB with Vietnamese error", async () => {
    const prod = await db.product.create({
      data: { name: "Test product", basePrice: 30000, categoryId },
    });

    const formData = new FormData();
    formData.append("productId", prod.id);

    // Create a dummy file > 2MB
    const largeBlob = new Blob([new Uint8Array(2 * 1024 * 1024 + 10)], { type: "image/jpeg" });
    const largeFile = new File([largeBlob], "large.jpg", { type: "image/jpeg" });
    formData.append("file", largeFile);

    const res = await uploadProductImageAction(formData);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Kích thước file ảnh không được vượt quá 2MB.");
  });

  it("rejects invalid file type with Vietnamese error", async () => {
    const prod = await db.product.create({
      data: { name: "Test product", basePrice: 30000, categoryId },
    });

    const formData = new FormData();
    formData.append("productId", prod.id);

    const badFile = new File(["dummy text content"], "document.pdf", { type: "application/pdf" });
    formData.append("file", badFile);

    const res = await uploadProductImageAction(formData);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Chỉ chấp nhận file ảnh định dạng JPEG, PNG hoặc WebP.");
  });

  it("uploads valid image, stores object key in DB, and returns publicUrl", async () => {
    const uploadSpy = vi.spyOn(storage, "uploadImage").mockResolvedValue("products/mock-key.webp");

    const prod = await db.product.create({
      data: { name: "Cà phê sữa đá", basePrice: 35000, categoryId },
    });

    const formData = new FormData();
    formData.append("productId", prod.id);

    const validBlob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/webp" });
    const validFile = new File([validBlob], "cf-sua.webp", { type: "image/webp" });
    formData.append("file", validFile);

    const res = await uploadProductImageAction(formData);
    expect(res.success).toBe(true);
    expect(res.key).toBeDefined();
    expect(res.url).toBeDefined();
    expect(uploadSpy).toHaveBeenCalled();

    const fromDb = await db.product.findUnique({ where: { id: prod.id } });
    expect(fromDb?.imageKey).not.toBeNull();
    // Verify DB stores only object key (not http full URL)
    expect(fromDb?.imageKey?.startsWith("http")).toBe(false);
    expect(fromDb?.imageKey?.startsWith("products/")).toBe(true);
  });

  it("deletes previous image object when replacing with a new one", async () => {
    const deleteSpy = vi.spyOn(storage, "deleteImage").mockResolvedValue();
    vi.spyOn(storage, "uploadImage").mockResolvedValue("products/new-key.jpg");

    const prod = await db.product.create({
      data: {
        name: "Trà sữa",
        basePrice: 40000,
        categoryId,
        imageKey: "products/old-key.png",
      },
    });

    const formData = new FormData();
    formData.append("productId", prod.id);

    const newBlob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    const newFile = new File([newBlob], "new.jpg", { type: "image/jpeg" });
    formData.append("file", newFile);

    const res = await uploadProductImageAction(formData);
    expect(res.success).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith("products/old-key.png");

    const fromDb = await db.product.findUnique({ where: { id: prod.id } });
    expect(fromDb?.imageKey).toBe("products/new-key.jpg");
  });

  it("deletes image via deleteProductImageAction and clears DB imageKey", async () => {
    const deleteSpy = vi.spyOn(storage, "deleteImage").mockResolvedValue();

    const prod = await db.product.create({
      data: {
        name: "Nước ép",
        basePrice: 45000,
        categoryId,
        imageKey: "products/juice.jpg",
      },
    });

    const res = await deleteProductImageAction(prod.id);
    expect(res.success).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith("products/juice.jpg");

    const fromDb = await db.product.findUnique({ where: { id: prod.id } });
    expect(fromDb?.imageKey).toBeNull();
  });
});

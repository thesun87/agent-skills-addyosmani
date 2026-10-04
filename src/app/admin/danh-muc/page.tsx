import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminCategories } from "@/features/menu/admin-actions/categories";
import { CategoryManager } from "@/features/menu/components/admin/CategoryManager";

export const metadata: Metadata = {
  title: "Quản Lý Danh Mục — Tuấn Linh Coffee",
  description: "Thêm, sửa, ẩn và sắp xếp thứ tự danh mục thực đơn",
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-text-muted">
          Đang tải danh mục...
        </div>
      }
    >
      <CategoryManager initialCategories={categories} />
    </Suspense>
  );
}

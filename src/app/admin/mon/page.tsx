import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminProducts } from "@/features/menu/admin-actions/products";
import { getAdminCategories } from "@/features/menu/admin-actions/categories";
import { getAdminOptionGroups } from "@/features/menu/admin-actions/option-groups";
import { ProductManager } from "@/features/menu/components/admin/ProductManager";

export const metadata: Metadata = {
  title: "Quản Lý Thực Đơn — Tuấn Linh Coffee",
  description: "Quản lý đồ uống, bánh ngọt, tuỳ chọn và trạng thái hết hàng",
};

export default async function AdminProductsPage() {
  const [products, categories, optionGroups] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getAdminOptionGroups(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-text-muted">
          Đang tải danh sách món...
        </div>
      }
    >
      <ProductManager
        initialProducts={products}
        categories={categories}
        optionGroups={optionGroups}
      />
    </Suspense>
  );
}

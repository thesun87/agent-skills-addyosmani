import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminOptionGroups } from "@/features/menu/admin-actions/option-groups";
import { OptionGroupManager } from "@/features/menu/components/admin/OptionGroupManager";

export const metadata: Metadata = {
  title: "Thư Viện Nhóm Tuỳ Chọn — Tuấn Linh Coffee",
  description: "Quản lý nhóm tuỳ chọn dùng chung: Size, Đường, Đá, Topping",
};

export default async function AdminOptionGroupsPage() {
  const groups = await getAdminOptionGroups();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-text-muted">
          Đang tải nhóm tuỳ chọn...
        </div>
      }
    >
      <OptionGroupManager initialGroups={groups} />
    </Suspense>
  );
}

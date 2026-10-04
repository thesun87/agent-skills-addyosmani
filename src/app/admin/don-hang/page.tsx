import { Suspense } from "react";
import { getAdminOrders, getAdminOrderCounts } from "@/features/orders/admin-queries";
import { OrdersManager } from "@/features/orders/components/admin/OrdersManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản Lý Đơn Hàng — Tuấn Linh Coffee",
  description: "Xử lý đơn hàng, theo dõi đơn mới và chuyển trạng thái quầy bar",
};

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    fulfillment?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const status = params.status || undefined;
  const fulfillment = params.fulfillment || undefined;
  const search = params.search || undefined;
  const page = parseInt(params.page || "1", 10);
  const limit = 8;

  const [ordersData, counts] = await Promise.all([
    getAdminOrders({ status, fulfillment, search, page, limit }),
    getAdminOrderCounts(),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Đang tải danh sách đơn hàng...</div>}>
      <OrdersManager
        initialOrders={ordersData.orders}
        initialTotal={ordersData.total}
        initialCounts={counts}
        initialPage={ordersData.page}
        initialLimit={ordersData.limit}
        initialTotalPages={ordersData.totalPages}
      />
    </Suspense>
  );
}

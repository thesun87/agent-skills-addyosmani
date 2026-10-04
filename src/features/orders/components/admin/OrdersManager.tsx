"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { OrderFilters } from "./OrderFilters";
import { OrderCard, type AdminOrderSummary } from "./OrderCard";
import { OrderPagination } from "./OrderPagination";
import { OrderDetail } from "./OrderDetail";
import { OrderSoundAlert } from "./OrderSoundAlert";
import { CancelOrderModal } from "./CancelOrderModal";
import {
  transitionOrderAction,
  cancelOrderAction,
  markPaidAction,
} from "../../admin-actions";
import type { OrderStatusString } from "../../domain/order-state-machine";

interface OrderCounts {
  all: number;
  pending: number;
  preparing: number;
  delivering: number;
  completed: number;
}

interface OrdersManagerProps {
  initialOrders: AdminOrderSummary[];
  initialTotal: number;
  initialCounts: OrderCounts;
  initialPage: number;
  initialLimit: number;
  initialTotalPages: number;
}

export function OrdersManager({
  initialOrders,
  initialTotal,
  initialCounts,
  initialPage,
  initialLimit,
  initialTotalPages,
}: OrdersManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state
  const statusParam = searchParams.get("status") || "ALL";
  const fulfillmentParam = searchParams.get("fulfillment") || "ALL";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || String(initialPage), 10);

  const [orders, setOrders] = useState<AdminOrderSummary[]>(initialOrders);
  const [total, setTotal] = useState<number>(initialTotal);
  const [counts, setCounts] = useState<OrderCounts>(initialCounts);
  const [page, setPage] = useState<number>(pageParam);
  const [limit] = useState<number>(initialLimit);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);

  const [search, setSearch] = useState<string>(searchParam);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrders[0]?.id || null
  );

  const [cancelModalOrder, setCancelModalOrder] = useState<AdminOrderSummary | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Helper to update URL query params
  const updateUrl = useCallback(
    (newParams: { status?: string; fulfillment?: string; search?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextStatus = newParams.status !== undefined ? newParams.status : statusParam;
      const nextFulfillment =
        newParams.fulfillment !== undefined ? newParams.fulfillment : fulfillmentParam;
      const nextSearch = newParams.search !== undefined ? newParams.search : search;
      const nextPage = newParams.page !== undefined ? newParams.page : page;

      if (nextStatus && nextStatus !== "ALL") params.set("status", nextStatus);
      else params.delete("status");

      if (nextFulfillment && nextFulfillment !== "ALL") params.set("fulfillment", nextFulfillment);
      else params.delete("fulfillment");

      if (nextSearch && nextSearch.trim()) params.set("search", nextSearch.trim());
      else params.delete("search");

      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, statusParam, fulfillmentParam, search, page]
  );

  // Fetch orders from API
  const fetchOrders = useCallback(async (overrideParams?: { status?: string; fulfillment?: string; search?: string; page?: number }) => {
    try {
      const activeStatus = overrideParams?.status !== undefined ? overrideParams.status : statusParam;
      const activeFulfillment = overrideParams?.fulfillment !== undefined ? overrideParams.fulfillment : fulfillmentParam;
      const activeSearch = overrideParams?.search !== undefined ? overrideParams.search : search;
      const activePage = overrideParams?.page !== undefined ? overrideParams.page : page;

      const query = new URLSearchParams();
      if (activeStatus && activeStatus !== "ALL") query.set("status", activeStatus);
      if (activeFulfillment && activeFulfillment !== "ALL") query.set("fulfillment", activeFulfillment);
      if (activeSearch && activeSearch.trim()) query.set("search", activeSearch.trim());
      query.set("page", String(activePage));
      query.set("limit", String(limit));

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.counts) setCounts(data.counts);

      if (data.orders.length > 0) {
        setSelectedOrderId((prev) =>
          prev && data.orders.some((o: AdminOrderSummary) => o.id === prev)
            ? prev
            : data.orders[0].id
        );
      } else {
        setSelectedOrderId(null);
      }
    } catch {
      // Polling error silently handled
    }
  }, [statusParam, fulfillmentParam, search, page, limit]);

  // Polling every 5s (A4)
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = (newStatus: string) => {
    setPage(1);
    updateUrl({ status: newStatus, page: 1 });
    void fetchOrders({ status: newStatus, page: 1 });
  };

  const handleFulfillmentChange = (newType: string) => {
    setPage(1);
    updateUrl({ fulfillment: newType, page: 1 });
    void fetchOrders({ fulfillment: newType, page: 1 });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    updateUrl({ search: val, page: 1 });
    void fetchOrders({ search: val, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    void fetchOrders({ page: newPage });
  };

  const handleTransition = async (orderId: string, nextStatus: string) => {
    try {
      setIsActionPending(true);
      const res = await transitionOrderAction(orderId, nextStatus as OrderStatusString);
      if (res.success) {
        await fetchOrders();
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsActionPending(false);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      setIsActionPending(true);
      const res = await markPaidAction(orderId);
      if (res.success) {
        await fetchOrders();
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setIsActionPending(false);
    }
  };

  const handleConfirmCancel = async (orderId: string, reason: string) => {
    const res = await cancelOrderAction(orderId, reason);
    if (res.success) {
      await fetchOrders();
    } else if (res.error) {
      throw new Error(res.error);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-surface">
      {/* Top Header */}
      <header className="main-header bg-surface-raised border-b border-border px-5 py-3 flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
        <div className="header-title-box flex flex-col">
          <h1 className="page-title font-display text-lg md:text-xl font-bold text-text" id="page-heading">
            <span>Quản lý đơn hàng</span>
          </h1>
          <span className="page-subtitle text-xs text-text-muted" id="page-subheading">
            Hôm nay: <strong id="current-date-text">{new Date().toLocaleDateString("vi-VN")}</strong> · Giờ mở cửa: 07:00 – 22:00
          </span>
        </div>

        <div className="header-actions flex items-center gap-3">
          <OrderSoundAlert orders={orders} />

          {/* Polling Indicator */}
          <div className="polling-indicator inline-flex items-center gap-1.5 text-xs text-text-muted bg-surface px-2.5 py-1 rounded-full border border-border">
            <span className="polling-dot"></span>
            <span>
              Tự làm mới: <strong>5s</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Master - Detail Workspace */}
      <div className="orders-workspace flex flex-1 overflow-hidden" id="section-orders">
        {/* Left Pane: Master List */}
        <div className="orders-master w-[330px] md:w-[390px] border-r border-border bg-surface-raised flex flex-col flex-shrink-0">
          <OrderFilters
            search={search}
            onSearchChange={handleSearchChange}
            status={statusParam}
            onStatusChange={handleStatusChange}
            counts={counts}
            fulfillment={fulfillmentParam}
            onFulfillmentChange={handleFulfillmentChange}
          />

          {/* Cards List */}
          <div className="order-cards-list flex-1 overflow-y-auto p-2.5 flex flex-col gap-2" id="order-cards-container">
            {orders.length === 0 ? (
              <div className="text-center py-12 px-3 text-text-muted">
                <span className="text-3xl block mb-2">📭</span>
                <p className="text-xs md:text-sm font-semibold">Không có đơn hàng nào khớp bộ lọc</p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isSelected={order.id === selectedOrderId}
                  onSelect={setSelectedOrderId}
                />
              ))
            )}
          </div>

          {/* Pagination Bar */}
          <OrderPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Right Pane: Detail View */}
        <OrderDetail
          order={selectedOrder}
          isActionPending={isActionPending}
          onTransition={handleTransition}
          onOpenCancelModal={(o) => setCancelModalOrder(o)}
          onMarkPaid={handleMarkPaid}
        />
      </div>

      <CancelOrderModal
        order={cancelModalOrder}
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}

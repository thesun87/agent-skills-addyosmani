import { db } from "@/lib/db";
import type { Prisma, OrderStatus, FulfillmentType } from "@prisma/client";

export interface GetAdminOrdersParams {
  status?: string;
  fulfillment?: string;
  search?: string;
  since?: string;
  page?: number;
  limit?: number;
}

export async function getAdminOrders(params: GetAdminOrdersParams = {}) {
  const { status, fulfillment, search, since, page = 1, limit = 8 } = params;

  const where: Prisma.OrderWhereInput = {};

  if (status && status !== "ALL") {
    where.status = status as OrderStatus;
  }

  if (fulfillment && fulfillment !== "ALL") {
    where.fulfillment = fulfillment as FulfillmentType;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { code: { contains: s, mode: "insensitive" } },
      { customerPhone: { contains: s } },
      { customerName: { contains: s, mode: "insensitive" } },
    ];
  }

  if (since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime())) {
      where.updatedAt = { gte: sinceDate };
    }
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    orders,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getAdminOrderCounts() {
  const [all, pending, preparing, delivering, completed] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "PREPARING" } }),
    db.order.count({ where: { status: "DELIVERING" } }),
    db.order.count({ where: { status: "COMPLETED" } }),
  ]);

  return {
    all,
    pending,
    preparing,
    delivering,
    completed,
  };
}

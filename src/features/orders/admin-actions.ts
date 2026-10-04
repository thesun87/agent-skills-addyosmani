"use server";

import { db } from "@/lib/db";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import {
  validateTransition,
  validateCancel,
  type OrderStatusString,
} from "./domain/order-state-machine";
import type { OrderStatus } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function transitionOrderAction(
  orderId: string,
  nextStatus: OrderStatusString
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi hệ thống." };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { success: false, error: "Đơn hàng không tồn tại." };
  }

  const validation = validateTransition(
    order.status as OrderStatusString,
    nextStatus,
    order.fulfillment
  );

  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus as OrderStatus,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: nextStatus as OrderStatus,
        createdById: admin.id,
      },
    });
  });

  return { success: true };
}

export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi hệ thống." };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { success: false, error: "Đơn hàng không tồn tại." };
  }

  const validation = validateCancel(order.status as OrderStatusString, reason);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const trimmedReason = reason.trim();

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelReason: trimmedReason,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: "CANCELLED",
        note: `Huỷ đơn: ${trimmedReason}`,
        createdById: admin.id,
      },
    });
  });

  return { success: true };
}

export async function markPaidAction(orderId: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Yêu cầu quyền quản trị viên." };
    }
    return { success: false, error: "Lỗi hệ thống." };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { success: false, error: "Đơn hàng không tồn tại." };
  }

  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paidAt: now,
        paidById: admin.id,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        toStatus: order.status,
        note: "Đã nhận tiền (đối soát VietQR)",
        createdById: admin.id,
      },
    });
  });

  return { success: true };
}

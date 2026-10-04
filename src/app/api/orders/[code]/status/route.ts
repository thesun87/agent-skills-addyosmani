import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrderCookieName, isOrderAccessAuthorized } from "@/features/orders/auth";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;

  const order = await db.order.findUnique({
    where: { code },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      customerPhone: true,
      updatedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Check authorization via cookie or query param phone
  const cookieName = getOrderCookieName(code);
  const cookieValue = request.cookies.get(cookieName)?.value;
  const phoneParam = request.nextUrl.searchParams.get("phone");

  const isAuthorized =
    isOrderAccessAuthorized(code, order.customerPhone, cookieValue) ||
    (phoneParam &&
      phoneParam.replace(/\D/g, "").slice(-9) === order.customerPhone.replace(/\D/g, "").slice(-9));

  if (!isAuthorized) {
    // Return 404 to never reveal order existence when unauthorized
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(
    {
      status: order.status,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

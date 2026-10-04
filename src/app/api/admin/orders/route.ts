import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/features/auth/require-admin";
import { getAdminOrders, getAdminOrderCounts } from "@/features/orders/admin-queries";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị viên." },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || undefined;
  const fulfillment = searchParams.get("fulfillment") || undefined;
  const search = searchParams.get("search") || undefined;
  const since = searchParams.get("since") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "8", 10);

  const [ordersData, counts] = await Promise.all([
    getAdminOrders({ status, fulfillment, search, since, page, limit }),
    getAdminOrderCounts(),
  ]);

  return NextResponse.json(
    {
      ...ordersData,
      counts,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

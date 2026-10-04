import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getShopSettings } from "@/features/settings/queries";
import { getOrderCookieName, isOrderAccessAuthorized } from "@/features/orders/auth";
import { PhoneVerificationGate } from "@/features/orders/components/PhoneVerificationGate";
import { OrderTrackingView } from "@/features/orders/components/OrderTrackingView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Đơn hàng ${code} | Tuấn Linh Coffee`,
    description: `Theo dõi trạng thái và tiến độ xử lý đơn hàng ${code}`,
  };
}

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const [order, settings, cookieStore] = await Promise.all([
    db.order.findUnique({
      where: { code },
      include: {
        items: true,
      },
    }),
    getShopSettings(),
    cookies(),
  ]);

  if (!order) {
    notFound();
  }

  const cookieName = getOrderCookieName(code);
  const cookieValue = cookieStore.get(cookieName)?.value;
  const isAuthorized = isOrderAccessAuthorized(code, order.customerPhone, cookieValue);

  if (!isAuthorized) {
    return <PhoneVerificationGate code={code} />;
  }

  return <OrderTrackingView order={order} settings={settings} />;
}

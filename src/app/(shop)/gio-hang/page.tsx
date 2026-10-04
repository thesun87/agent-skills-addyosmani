import type { Metadata } from "next";
import { getVisibleMenu } from "@/features/menu/queries";
import { CartView } from "@/features/cart/components/CartView";

export const metadata: Metadata = {
  title: "Giỏ hàng | Tuấn Linh Coffee",
  description: "Xem và điều chỉnh giỏ hàng của bạn tại Tuấn Linh Coffee",
};

export default async function CartPage() {
  const categories = await getVisibleMenu();
  const allProducts = categories.flatMap((c) => c.products);

  const defaultSettings = {
    shippingFee: 15000,
    freeShippingThreshold: 150000,
  };

  return <CartView menuProducts={allProducts} settings={defaultSettings} />;
}

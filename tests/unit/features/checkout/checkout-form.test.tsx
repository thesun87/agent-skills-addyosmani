import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider } from "@/features/cart/CartContext";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import type { MenuProduct } from "@/features/menu/queries";
import type { ShopSettings } from "@/features/settings/schema";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockPlaceOrder = vi.fn();
vi.mock("@/features/checkout/actions", () => ({
  placeOrder: (...args: unknown[]) => mockPlaceOrder(...args),
}));

const sampleProducts: MenuProduct[] = [
  {
    id: "prod-1",
    name: "Cà phê sữa đá",
    description: "Cà phê Robusta Đắk Lắk",
    basePrice: 29000,
    imageUrl: null,
    isAvailable: true,
    categoryId: "cat-coffee",
    optionGroups: [
      {
        id: "grp-size",
        name: "Size",
        isRequired: true,
        maxSelect: 1,
        options: [{ id: "opt-size-m", name: "Size M", priceDelta: 0 }],
      },
    ],
  },
] as unknown as MenuProduct[];

const sampleSettings: ShopSettings = {
  id: "default",
  shopName: "Tuấn Linh Coffee",
  address: "123 Lê Lợi, Q1",
  phone: "0987654321",
  openTime: "07:00",
  closeTime: "22:00",
  deliveryRadiusKm: 5,
  shippingFee: 15000,
  freeShippingThreshold: 150000,
  bankBin: "970422",
  bankAccountNo: "0987654321",
  bankAccountName: "TUAN LINH COFFEE",
};

const initialCart = [
  {
    id: "line-1",
    productId: "prod-1",
    optionIds: ["opt-size-m"],
    quantity: 2,
  },
];

describe("CheckoutForm (T8, C4, C5, C6, C9-UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders DELIVERY tab fields by default", () => {
    render(
      <CartProvider initialItems={initialCart}>
        <CheckoutForm
          menuProducts={sampleProducts}
          settings={sampleSettings}
          isOpen={true}
          availablePickupSlots={["08:00", "08:15", "08:30"]}
        />
      </CartProvider>,
    );

    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Địa chỉ giao hàng/i)).toBeInTheDocument();
    expect(screen.getByText(/Giao trong bán kính 5 km/i)).toBeInTheDocument();
  });

  it("switches to PICKUP tab and updates fields", () => {
    render(
      <CartProvider initialItems={initialCart}>
        <CheckoutForm
          menuProducts={sampleProducts}
          settings={sampleSettings}
          isOpen={true}
          availablePickupSlots={["08:00", "08:15", "08:30"]}
        />
      </CartProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Lấy tại quán/i }));

    expect(screen.queryByLabelText(/Địa chỉ giao hàng/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Giờ lấy món/i)).toBeInTheDocument();
  });

  it("shows validation error on client if fields are empty", async () => {
    render(
      <CartProvider initialItems={initialCart}>
        <CheckoutForm
          menuProducts={sampleProducts}
          settings={sampleSettings}
          isOpen={true}
          availablePickupSlots={["08:00", "08:15"]}
        />
      </CartProvider>,
    );

    const submitBtn = screen.getByRole("button", { name: /Đặt hàng ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập họ và tên/i)).toBeInTheDocument();
    });
    expect(mockPlaceOrder).not.toHaveBeenCalled();
  });

  it("submits valid delivery order and navigates to tracking page on success", async () => {
    mockPlaceOrder.mockResolvedValueOnce({
      success: true,
      data: { code: "CF-261004-ABCD" },
    });

    render(
      <CartProvider initialItems={initialCart}>
        <CheckoutForm
          menuProducts={sampleProducts}
          settings={sampleSettings}
          isOpen={true}
          availablePickupSlots={["08:00"]}
        />
      </CartProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: "Nguyễn Văn Tuấn" },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: "0987654321" },
    });
    fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), {
      target: { value: "123 Lê Lợi, Quận 1" },
    });

    const submitBtn = screen.getByRole("button", { name: /Đặt hàng ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/don-hang/CF-261004-ABCD");
    });
  });

  it("disables submit button and shows closed warning when shop is closed (C9)", () => {
    render(
      <CartProvider initialItems={initialCart}>
        <CheckoutForm
          menuProducts={sampleProducts}
          settings={sampleSettings}
          isOpen={false}
          availablePickupSlots={[]}
        />
      </CartProvider>,
    );

    const submitBtn = screen.getByRole("button", { name: /Quán đang đóng cửa/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Quán đang đóng cửa, mở lại lúc 07:00/i)).toBeInTheDocument();
  });
});

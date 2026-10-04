import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "@/features/cart/CartContext";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import type { MenuProduct } from "@/features/menu/queries";

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
        options: [
          { id: "opt-size-m", name: "Size M", priceDelta: 0 },
          { id: "opt-size-l", name: "Size L", priceDelta: 6000 },
        ],
      },
    ],
  },
] as unknown as MenuProduct[];

const shopSettings = {
  shippingFee: 15000,
  freeShippingThreshold: 150000,
};

function TestCartConsumer() {
  const { items, addItem, updateQuantity, removeItem, clearCart, totalCount } = useCart();
  return (
    <div>
      <div data-testid="count">{totalCount}</div>
      <div data-testid="items-length">{items.length}</div>
      <button
        onClick={() =>
          addItem({
            productId: "prod-1",
            optionIds: ["opt-size-m"],
            quantity: 2,
          })
        }
      >
        Thêm món
      </button>
      {items.map((item) => (
        <div key={item.id}>
          <span data-testid={`qty-${item.id}`}>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          <button onClick={() => removeItem(item.id)}>Xoá</button>
        </div>
      ))}
      <button onClick={clearCart}>Xoá hết</button>
    </div>
  );
}

describe("CartContext & UI Integration (T6, C3)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("adds item and updates count via CartProvider", () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>,
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");

    fireEvent.click(screen.getByText("Thêm món"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("items-length")).toHaveTextContent("1");

    // Add again -> merges quantity
    fireEvent.click(screen.getByText("Thêm món"));
    expect(screen.getByTestId("count")).toHaveTextContent("4");
    expect(screen.getByTestId("items-length")).toHaveTextContent("1");
  });

  it("renders CartDrawer empty state when no items", () => {
    render(
      <CartProvider initialIsOpen={true}>
        <CartDrawer menuProducts={sampleProducts} settings={shopSettings} />
      </CartProvider>,
    );

    expect(screen.getByText("Giỏ hàng đang trống")).toBeInTheDocument();
  });

  it("renders cart lines with correct price derivation and free shipping meter", () => {
    const initialItems = [
      {
        id: "line-1",
        productId: "prod-1",
        optionIds: ["opt-size-l"],
        quantity: 2, // (29k + 6k) * 2 = 70k
      },
    ];

    render(
      <CartProvider initialItems={initialItems} initialIsOpen={true}>
        <CartDrawer menuProducts={sampleProducts} settings={shopSettings} />
      </CartProvider>,
    );

    expect(screen.getByText("Cà phê sữa đá")).toBeInTheDocument();
    expect(screen.getAllByText("70.000đ").length).toBeGreaterThanOrEqual(1);
    // 150k - 70k = 80k needed for free shipping
    expect(screen.getByText("80.000đ")).toBeInTheDocument();
    expect(screen.getByText("Miễn phí giao hàng")).toBeInTheDocument();
  });
});

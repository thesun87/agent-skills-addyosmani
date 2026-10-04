import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductOptionsSheet } from "@/features/menu/components/ProductOptionsSheet";

const sampleProductWithOptions = {
  id: "prod-cf-sua",
  categoryId: "cat-1",
  name: "Cà phê sữa đá",
  description: "Phin truyền thống",
  basePrice: 29_000,
  imageUrl: null,
  isAvailable: true,
  isArchived: false,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  optionGroups: [
    {
      id: "grp-size",
      productId: "prod-cf-sua",
      name: "Size",
      isRequired: true,
      maxSelect: 1,
      sortOrder: 0,
      options: [
        { id: "opt-size-m", groupId: "grp-size", name: "Size M", priceDelta: 0, sortOrder: 0 },
        { id: "opt-size-l", groupId: "grp-size", name: "Size L", priceDelta: 6_000, sortOrder: 1 },
      ],
    },
    {
      id: "grp-sugar",
      productId: "prod-cf-sua",
      name: "Đường",
      isRequired: true,
      maxSelect: 1,
      sortOrder: 1,
      options: [
        { id: "opt-sugar-0", groupId: "grp-sugar", name: "0%", priceDelta: 0, sortOrder: 0 },
        { id: "opt-sugar-70", groupId: "grp-sugar", name: "70%", priceDelta: 0, sortOrder: 1 },
      ],
    },
    {
      id: "grp-topping",
      productId: "prod-cf-sua",
      name: "Topping",
      isRequired: false,
      maxSelect: 2,
      sortOrder: 2,
      options: [
        {
          id: "opt-top-tran-chau",
          groupId: "grp-topping",
          name: "Trân châu",
          priceDelta: 8_000,
          sortOrder: 0,
        },
        {
          id: "opt-top-thach",
          groupId: "grp-topping",
          name: "Thạch củ năng",
          priceDelta: 8_000,
          sortOrder: 1,
        },
        {
          id: "opt-top-cheese",
          groupId: "grp-topping",
          name: "Kem cheese",
          priceDelta: 8_000,
          sortOrder: 2,
        },
      ],
    },
  ],
};

describe("ProductOptionsSheet", () => {
  it("renders product name, base price, and option group names", () => {
    render(
      <ProductOptionsSheet
        product={sampleProductWithOptions}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Cà phê sữa đá" })).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Đường")).toBeInTheDocument();
    expect(screen.getByText("Topping")).toBeInTheDocument();
  });

  it("disables add button when a required group is not selected", () => {
    render(
      <ProductOptionsSheet
        product={sampleProductWithOptions}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /thêm vào giỏ/i });
    expect(submitBtn).toBeDisabled();
  });

  it("updates price and enables add button when required groups are selected", () => {
    const onAddToCart = vi.fn();
    render(
      <ProductOptionsSheet
        product={sampleProductWithOptions}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={onAddToCart}
      />,
    );

    // Select Size L (+6.000)
    fireEvent.click(screen.getByRole("button", { name: /size l/i }));
    // Select Đường 70% (+0)
    fireEvent.click(screen.getByRole("button", { name: /70%/i }));

    const submitBtn = screen.getByRole("button", { name: /thêm vào giỏ/i });
    expect(submitBtn).toBeEnabled();
    // 29.000 + 6.000 = 35.000đ
    expect(screen.getByText(/35\.000đ/)).toBeInTheDocument();

    // Select a topping: Trân châu (+8.000)
    fireEvent.click(screen.getByRole("button", { name: /trân châu/i }));
    // 35.000 + 8.000 = 43.000đ
    expect(screen.getByText(/43\.000đ/)).toBeInTheDocument();

    // Increase quantity to 2
    fireEvent.click(screen.getByRole("button", { name: /tăng số lượng/i }));
    // 43.000 * 2 = 86.000đ
    expect(screen.getByText(/86\.000đ/)).toBeInTheDocument();

    // Submit
    fireEvent.click(submitBtn);

    expect(onAddToCart).toHaveBeenCalledWith({
      productId: "prod-cf-sua",
      optionIds: ["opt-size-l", "opt-sugar-70", "opt-top-tran-chau"],
      quantity: 2,
      note: "",
    });
  });

  it("enforces maxSelect limit on multi-select option groups", () => {
    render(
      <ProductOptionsSheet
        product={sampleProductWithOptions}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /trân châu/i }));
    fireEvent.click(screen.getByRole("button", { name: /thạch củ năng/i }));
    // maxSelect is 2, third topping should not be selected
    fireEvent.click(screen.getByRole("button", { name: /kem cheese/i }));

    // Price should only reflect 2 toppings (8000 + 8000 = 16000)
    // Select required options to see price active
    fireEvent.click(screen.getByRole("button", { name: /size m/i }));
    fireEvent.click(screen.getByRole("button", { name: /70%/i }));

    // 29000 + 16000 = 45.000đ
    expect(screen.getByText(/45\.000đ/)).toBeInTheDocument();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <ProductOptionsSheet
        product={sampleProductWithOptions}
        isOpen={true}
        onClose={onClose}
        onAddToCart={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

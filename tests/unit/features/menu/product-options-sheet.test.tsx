import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductOptionsSheet } from "@/features/menu/components/ProductOptionsSheet";

const now = new Date();

const makeOption = (id: string, groupId: string, name: string, priceDelta = 0, sortOrder = 0) => ({
  id,
  groupId,
  name,
  priceDelta,
  sortOrder,
  createdAt: now,
  updatedAt: now,
});

const makeGroup = (
  id: string,
  name: string,
  isRequired: boolean,
  maxSelect: number,
  sortOrder: number,
  options: ReturnType<typeof makeOption>[],
) => ({
  id,
  name,
  isRequired,
  maxSelect,
  sortOrder,
  createdAt: now,
  updatedAt: now,
  options,
});

const sampleProductWithOptions = {
  id: "prod-cf-sua",
  categoryId: "cat-1",
  name: "Cà phê sữa đá",
  description: "Phin truyền thống",
  basePrice: 29_000,
  imageUrl: null,
  imageKey: null,
  isAvailable: true,
  isArchived: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
  optionGroups: [
    makeGroup("grp-size", "Size", true, 1, 0, [
      makeOption("opt-size-m", "grp-size", "Size M", 0, 0),
      makeOption("opt-size-l", "grp-size", "Size L", 6_000, 1),
    ]),
    makeGroup("grp-sugar", "Đường", true, 1, 1, [
      makeOption("opt-sugar-0", "grp-sugar", "0%", 0, 0),
      makeOption("opt-sugar-70", "grp-sugar", "70%", 0, 1),
    ]),
    makeGroup("grp-topping", "Topping", false, 2, 2, [
      makeOption("opt-top-tran-chau", "grp-topping", "Trân châu", 8_000, 0),
      makeOption("opt-top-thach", "grp-topping", "Thạch củ năng", 8_000, 1),
      makeOption("opt-top-cheese", "grp-topping", "Kem cheese", 8_000, 2),
    ]),
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

  it("does not leak options from previous product when product prop changes", () => {
    const onAddToCart = vi.fn();
    const secondProduct = {
      id: "prod-tra-dao",
      categoryId: "cat-tra",
      name: "Trà đào cam sả",
      description: "Trà đen đào",
      basePrice: 39_000,
      imageUrl: null,
      imageKey: null,
      isAvailable: true,
      isArchived: false,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
      optionGroups: [
        makeGroup("grp-tra-size", "Size", true, 1, 0, [
          makeOption("opt-tra-size-m", "grp-tra-size", "M", 0, 0),
        ]),
      ],
    };

    const { rerender } = render(
      <ProductOptionsSheet
        product={sampleProductWithOptions}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={onAddToCart}
      />,
    );

    // Select Size L on first product
    fireEvent.click(screen.getByRole("button", { name: /size l/i }));

    // Switch to second product
    rerender(
      <ProductOptionsSheet
        product={secondProduct}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={onAddToCart}
      />,
    );

    // Select M on second product
    fireEvent.click(screen.getByRole("button", { name: /^m$/i }));
    fireEvent.click(screen.getByRole("button", { name: /thêm vào giỏ/i }));

    expect(onAddToCart).toHaveBeenCalledWith({
      productId: "prod-tra-dao",
      optionIds: ["opt-tra-size-m"],
      quantity: 1,
      note: "",
    });
  });
});

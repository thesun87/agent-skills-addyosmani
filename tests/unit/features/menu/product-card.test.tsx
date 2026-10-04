import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCard } from "@/features/menu/components/ProductCard";

const sampleProduct = {
  id: "prod-1",
  categoryId: "cat-1",
  name: "Cà phê sữa đá",
  description: "Phin truyền thống Robusta rang mộc hoà quyện sữa đặc hảo hạng.",
  basePrice: 29_000,
  imageUrl: null,
  isAvailable: true,
  isArchived: false,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ProductCard", () => {
  it("renders product name, description and formatted price", () => {
    render(<ProductCard product={sampleProduct} onSelect={vi.fn()} />);

    expect(screen.getByText("Cà phê sữa đá")).toBeInTheDocument();
    expect(
      screen.getByText("Phin truyền thống Robusta rang mộc hoà quyện sữa đặc hảo hạng."),
    ).toBeInTheDocument();
    expect(screen.getByText("29.000đ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thêm/i })).toBeEnabled();
  });

  it("disables add button and shows 'Hết hàng' when isAvailable is false", () => {
    const unavailableProduct = { ...sampleProduct, isAvailable: false };
    render(<ProductCard product={unavailableProduct} onSelect={vi.fn()} />);

    expect(screen.getByText("Hết hàng")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /tạm hết/i });
    expect(btn).toBeDisabled();
  });

  it("calls onSelect when clicking add button on available product", () => {
    const onSelect = vi.fn();
    render(<ProductCard product={sampleProduct} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /thêm/i }));
    expect(onSelect).toHaveBeenCalledWith(sampleProduct);
  });
});

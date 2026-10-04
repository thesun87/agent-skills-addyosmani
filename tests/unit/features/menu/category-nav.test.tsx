import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryNav } from "@/features/menu/components/CategoryNav";

const sampleCategories = [
  { id: "cat-1", name: "Cà phê Việt" },
  { id: "cat-2", name: "Cà phê Ý" },
  { id: "cat-3", name: "Trà tươi" },
];

describe("CategoryNav", () => {
  it("renders all category buttons", () => {
    render(
      <CategoryNav
        categories={sampleCategories}
        activeCategoryId="cat-1"
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Cà phê Việt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cà phê Ý" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trà tươi" })).toBeInTheDocument();
  });

  it("calls onSelectCategory when a chip is clicked", () => {
    const onSelect = vi.fn();
    render(
      <CategoryNav
        categories={sampleCategories}
        activeCategoryId="cat-1"
        onSelectCategory={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trà tươi" }));
    expect(onSelect).toHaveBeenCalledWith("cat-3");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/(shop)/page";

vi.mock("@/features/menu/queries", () => ({
  getVisibleMenu: vi.fn().mockResolvedValue([
    {
      id: "cat-1",
      name: "Cà phê Việt",
      sortOrder: 0,
      isVisible: true,
      products: [
        {
          id: "prod-1",
          categoryId: "cat-1",
          name: "Cà phê sữa đá",
          description: "Phin truyền thống",
          basePrice: 29_000,
          imageUrl: null,
          isAvailable: true,
          isArchived: false,
          sortOrder: 0,
          optionGroups: [],
        },
      ],
    },
  ]),
}));

describe("HomePage", () => {
  it("renders brand heading and menu categories from query", async () => {
    const Component = await HomePage();
    render(Component);

    expect(screen.getByRole("heading", { level: 1, name: "Tuấn Linh Coffee" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Cà phê Việt" })).toBeInTheDocument();
    expect(screen.getByText("Cà phê sữa đá")).toBeInTheDocument();
  });
});

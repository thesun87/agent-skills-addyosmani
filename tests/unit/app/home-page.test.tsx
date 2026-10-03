import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("shows the shop name as the main heading", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Tuấn Linh Coffee" })).toBeInTheDocument();
  });
});

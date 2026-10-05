import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

describe("T17: Brand Assets & Outlined Logo", () => {
  it("generates pure SVG logo without <text> tags so it renders identically everywhere", () => {
    const logoSvg = fs.readFileSync(path.resolve("public/brand/logo.svg"), "utf8");
    const markSvg = fs.readFileSync(path.resolve("public/brand/logo-mark.svg"), "utf8");
    const monoSvg = fs.readFileSync(path.resolve("public/brand/logo-mono.svg"), "utf8");

    expect(logoSvg).not.toContain("<text");
    expect(logoSvg).toContain("<path");
    expect(logoSvg).toContain('aria-label="Tuấn Linh Coffee"');

    expect(markSvg).not.toContain("<text");
    expect(markSvg).toContain("<circle");

    expect(monoSvg).not.toContain("<text");
    expect(monoSvg).toContain("<path");
  });

  it("provides favicon (icon.svg), apple-icon.png, and opengraph-image.png", () => {
    expect(fs.existsSync(path.resolve("src/app/icon.svg"))).toBe(true);
    expect(fs.existsSync(path.resolve("src/app/apple-icon.png"))).toBe(true);
    expect(fs.existsSync(path.resolve("src/app/opengraph-image.png"))).toBe(true);
  });

  it("renders BrandLogo component with path outlines and no <text> tags", () => {
    const { container } = render(<BrandLogo asHeading={true} />);
    const textEls = container.querySelectorAll("text");
    expect(textEls.length).toBe(0);

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(5);
  });
});

describe("T17: SiteHeader & SiteFooter", () => {
  it("renders SiteHeader with logo and cart button", () => {
    render(<SiteHeader cartCount={3} />);
    expect(screen.getByText("Tuấn Linh Coffee")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders SiteFooter with shop name, address, phone, and opening hours from settings", () => {
    const mockSettings = {
      id: "default",
      shopName: "Tuấn Linh Coffee",
      address: "123 Đường Cà Phê, Quận 1, TP. HCM",
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

    render(<SiteFooter settings={mockSettings} />);
    expect(screen.getAllByText("Tuấn Linh Coffee").length).toBeGreaterThan(0);
    expect(screen.getByText(/123 Đường Cà Phê/)).toBeInTheDocument();
    expect(screen.getByText(/0987\.654\.321|0987654321/)).toBeInTheDocument();
    expect(screen.getByText(/07:00\s*-\s*22:00/)).toBeInTheDocument();
  });
});

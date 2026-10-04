import { describe, it, expect } from "vitest";
import { publicUrl } from "@/lib/storage";

describe("Storage publicUrl", () => {
  it("returns null for empty key", () => {
    expect(publicUrl(null)).toBeNull();
    expect(publicUrl(undefined)).toBeNull();
    expect(publicUrl("")).toBeNull();
  });

  it("returns original URL if key is already an absolute URL", () => {
    expect(publicUrl("http://example.com/image.png")).toBe("http://example.com/image.png");
    expect(publicUrl("https://example.com/image.png")).toBe("https://example.com/image.png");
  });

  it("constructs full storage URL for relative object key", () => {
    const url = publicUrl("products/cafe.jpg");
    expect(url).toContain("products/cafe.jpg");
    expect(url?.startsWith("http")).toBe(true);

    const leadingSlashUrl = publicUrl("/products/cafe.jpg");
    expect(leadingSlashUrl).toBe(url);
  });
});

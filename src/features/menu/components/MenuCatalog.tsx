"use client";

import { useEffect, useMemo, useState } from "react";
import type { MenuCategory, MenuProduct } from "../queries";
import type { CartLineInput } from "@/features/cart/schema";
import { useCart } from "@/features/cart/CartContext";
import { ShopHeader } from "@/components/ui/ShopHeader";
import { DesktopCartPanel } from "@/features/cart/components/DesktopCartPanel";
import { CategoryNav } from "./CategoryNav";
import { ProductCard } from "./ProductCard";
import { ProductOptionsSheet } from "./ProductOptionsSheet";

export interface MenuCatalogProps {
  categories: ReadonlyArray<MenuCategory>;
  onSelectProduct?: (product: MenuProduct) => void;
  onAddToCart?: (line: CartLineInput) => void;
}

export function MenuCatalog({ categories, onSelectProduct, onAddToCart }: MenuCatalogProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);

  const { addItem } = useCart();

  const allProducts = useMemo(() => categories.flatMap((c) => c.products), [categories]);

  // Active category scroll spy
  useEffect(() => {
    const sectionElements = categories
      .map((c) => document.getElementById(`category-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);

    if (
      sectionElements.length === 0 ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
          const sectionId = topEntry.target.id.replace("category-", "");
          setActiveCategoryId(sectionId);
        }
      },
      {
        rootMargin: "-100px 0px -70% 0px",
        threshold: [0, 0.1],
      },
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const handleCardClick = (product: MenuProduct) => {
    setSelectedProduct(product);
    onSelectProduct?.(product);
  };

  const handleAddToCart = (line: CartLineInput) => {
    if (onAddToCart) {
      onAddToCart(line);
    } else {
      addItem({
        productId: line.productId,
        optionIds: line.optionIds,
        quantity: line.quantity,
        note: line.note,
      });
    }
    setSelectedProduct(null);
  };

  return (
    <div className="w-full">
      <ShopHeader>
        <CategoryNav
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
        />
      </ShopHeader>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-start gap-8">
          {/* Left: Product Catalog */}
          <div className="min-w-0 flex-1">
            {categories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="mb-10 scroll-mt-32"
              >
                <h2 className="font-display text-text mb-4 flex items-center gap-2 text-xl font-bold">
                  <span
                    className="bg-accent inline-block h-4 w-1 rounded-full"
                    aria-hidden="true"
                  />
                  {category.name}
                </h2>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} onSelect={handleCardClick} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Right: Desktop Sticky Cart Panel (shown on screens >= 1024px) */}
          <aside className="sticky top-32 hidden w-80 shrink-0 lg:block xl:w-96">
            <DesktopCartPanel menuProducts={allProducts} />
          </aside>
        </div>
      </main>

      {/* Product Options Sheet */}
      {selectedProduct && (
        <ProductOptionsSheet
          key={selectedProduct.id}
          product={selectedProduct}
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

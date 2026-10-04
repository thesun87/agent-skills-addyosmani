"use client";

import { useState } from "react";
import type { MenuCategory, MenuProduct } from "../queries";
import type { CartLineInput } from "@/features/cart/schema";
import { useCart } from "@/features/cart/CartContext";
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
      <CategoryNav
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />

      <div className="mx-auto max-w-5xl px-4 py-6">
        {categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="mb-10 scroll-mt-28">
            <h2 className="font-display text-text mb-4 flex items-center gap-2 text-xl font-bold">
              <span className="bg-accent inline-block h-4 w-1 rounded-full" aria-hidden="true" />
              {category.name}
            </h2>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-2">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={handleCardClick} />
              ))}
            </div>
          </section>
        ))}
      </div>

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

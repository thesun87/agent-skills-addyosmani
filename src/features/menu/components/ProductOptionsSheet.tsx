"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { CartLineInput } from "@/features/cart/schema";
import { formatVnd } from "@/lib/money";
import { calculateUnitPrice } from "@/lib/pricing";
import type { MenuProduct } from "../queries";

export interface ProductOptionsSheetProps {
  product: MenuProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartLine: CartLineInput) => void;
}

export function ProductOptionsSheet({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductOptionsSheetProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>("");

  // Collect all selected option IDs in order
  const selectedOptionIds = useMemo(() => {
    return Object.values(selectedOptions).flat();
  }, [selectedOptions]);

  // Calculate pricing
  const { lineTotal, areRequiredGroupsSatisfied } = useMemo(() => {
    if (!product) {
      return { lineTotal: 0, areRequiredGroupsSatisfied: false };
    }

    const deltas: number[] = [];
    let requiredSatisfied = true;

    for (const group of product.optionGroups) {
      const selectedInGroup = selectedOptions[group.id] ?? [];
      if (group.isRequired && selectedInGroup.length === 0) {
        requiredSatisfied = false;
      }

      for (const optId of selectedInGroup) {
        const option = group.options.find((o) => o.id === optId);
        if (option) {
          deltas.push(option.priceDelta);
        }
      }
    }

    const unit = calculateUnitPrice(product.basePrice, deltas);
    const total = unit * quantity;

    return {
      unitPrice: unit,
      lineTotal: total,
      areRequiredGroupsSatisfied: requiredSatisfied,
    };
  }, [product, selectedOptions, quantity]);

  if (!product) return null;

  const handleSelectOption = (groupId: string, optionId: string, maxSelect: number) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] ?? [];

      if (maxSelect === 1) {
        return { ...prev, [groupId]: [optionId] };
      }

      // Multi-select
      if (current.includes(optionId)) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== optionId),
        };
      }

      if (current.length < maxSelect) {
        return {
          ...prev,
          [groupId]: [...current, optionId],
        };
      }

      return prev;
    });
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next >= 1 && next <= 50) return next;
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areRequiredGroupsSatisfied) return;

    onAddToCart({
      productId: product.id,
      optionIds: selectedOptionIds,
      quantity,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={product.name}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="space-y-6 p-4 sm:p-6">
          {/* Header Preview */}
          <div className="flex items-start justify-between border-b border-border/60 pb-4">
            <div>
              <p className="font-bold text-lg text-primary">{formatVnd(product.basePrice)}</p>
              {product.description ? (
                <p className="mt-1 text-sm text-text-muted">{product.description}</p>
              ) : null}
            </div>
          </div>

          {/* Option Groups */}
          {product.optionGroups.map((group) => {
            const selectedInGroup = selectedOptions[group.id] ?? [];

            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text">{group.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      group.isRequired
                        ? "bg-primary/10 text-primary"
                        : "bg-surface text-text-muted"
                    }`}
                  >
                    {group.isRequired ? "Bắt buộc" : `Tối đa ${group.maxSelect}`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isSelected = selectedInGroup.includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(group.id, option.id, group.maxSelect)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-all ${
                          isSelected
                            ? "border-primary bg-primary/8 font-semibold text-primary shadow-xs"
                            : "border-border/80 bg-surface text-text hover:border-text/30"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span>{option.name}</span>
                        {option.priceDelta > 0 ? (
                          <span
                            className={isSelected ? "text-primary" : "text-text-muted"}
                          >
                            (+{formatVnd(option.priceDelta)})
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special instructions */}
          <div className="space-y-1.5">
            <label htmlFor="product-note" className="font-semibold text-sm text-text">
              Ghi chú cho quán (tuỳ chọn)
            </label>
            <input
              id="product-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Đậm vị cà phê, ít ngọt..."
              maxLength={200}
              className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-border/80 bg-surface-raised p-4 sm:p-6">
          <div className="flex h-11 items-center rounded-full border border-border/80 bg-surface px-1">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-text hover:bg-black/5 disabled:opacity-30"
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-text">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 50}
              className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-text hover:bg-black/5 disabled:opacity-30"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>

          <button
            type="submit"
            disabled={!areRequiredGroupsSatisfied}
            className="flex h-11 flex-1 items-center justify-between rounded-full bg-primary px-5 font-bold text-sm text-white shadow-xs transition-all hover:bg-primary-hover active:scale-98 disabled:cursor-not-allowed disabled:bg-border disabled:text-text-muted"
          >
            <span>Thêm vào giỏ</span>
            <span>{formatVnd(lineTotal)}</span>
          </button>
        </div>
      </form>
    </Sheet>
  );
}

"use client";

import Image from "next/image";
import { formatVnd } from "@/lib/money";

export interface BaseProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string | null;
  isAvailable: boolean;
}

export interface ProductCardProps<T extends BaseProduct = BaseProduct> {
  product: T;
  onSelect?: (product: T) => void;
}

export function ProductCard<T extends BaseProduct>({ product, onSelect }: ProductCardProps<T>) {
  const isOutOfStock = !product.isAvailable;

  const handleClick = () => {
    if (!isOutOfStock && onSelect) {
      onSelect(product);
    }
  };

  return (
    <article
      className={`group border-border/80 bg-surface-raised hover:border-text/20 relative flex gap-3.5 rounded-xl border p-3.5 shadow-xs transition-all hover:shadow-md ${
        isOutOfStock ? "bg-[#f4ede3] opacity-65" : "cursor-pointer"
      }`}
      onClick={handleClick}
    >
      <div className="relative flex h-[90px] w-[90px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#eddccb]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={90}
            height={90}
            className="h-full w-full object-cover"
          />
        ) : (
          <svg
            className="text-primary h-12 w-12"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="30" fill="#EAD9C8" />
            <path
              d="M20 24H44L41 44C40 48 36 50 32 50C28 50 24 48 23 44L20 24Z"
              fill="currentColor"
            />
            <path
              d="M44 28C48 28 50 32 50 35C50 38 48 41 43 41"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M28 14C27 17 30 19 28 22"
              stroke="#E8892B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M34 12C33 16 36 18 34 22"
              stroke="#E8892B"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}

        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold tracking-wider text-white uppercase">
            Hết hàng
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="text-text line-clamp-1 text-base font-semibold">{product.name}</h3>
          {product.description ? (
            <p className="text-text-muted mt-1 line-clamp-2 text-xs leading-relaxed">
              {product.description}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-primary text-base font-bold">{formatVnd(product.basePrice)}</span>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={`inline-flex h-8 items-center justify-center rounded-full px-3.5 text-xs font-semibold transition-all ${
              isOutOfStock
                ? "cursor-not-allowed bg-[#b5a79f] text-white"
                : "bg-primary hover:bg-primary-hover text-white shadow-xs active:scale-95"
            }`}
            aria-label={isOutOfStock ? "Tạm hết món" : `Thêm ${product.name}`}
          >
            {isOutOfStock ? "Tạm hết" : "+ Thêm"}
          </button>
        </div>
      </div>
    </article>
  );
}

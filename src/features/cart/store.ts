import { z } from "zod";
import type { MenuProduct } from "@/features/menu/queries";
import { calculateTotals, type FulfillmentType, type PricedLine } from "@/lib/pricing";

export const CART_STORAGE_KEY = "tuanlinh_cart_v1";

export interface CartItem {
  id: string;
  productId: string;
  optionIds: string[];
  quantity: number;
  note?: string;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | {
      type: "ADD_ITEM";
      item: {
        productId: string;
        optionIds: string[];
        quantity: number;
        note?: string;
      };
    }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; items: CartItem[] };

/**
 * Derives a deterministic cart line ID from product ID, sorted option IDs, and trimmed note.
 */
export function buildCartItemId(
  productId: string,
  optionIds: readonly string[],
  note?: string,
): string {
  const sortedOpts = [...optionIds].sort().join(",");
  const cleanNote = note?.trim().toLowerCase() ?? "";
  return `${productId}::${sortedOpts}::${cleanNote}`;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { productId, optionIds, quantity, note } = action.item;
      if (quantity <= 0) return state;

      const id = buildCartItemId(productId, optionIds, note);
      const existingIndex = state.items.findIndex((item) => item.id === id);

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];
        const newQty = Math.min(99, existing.quantity + quantity);
        updatedItems[existingIndex] = { ...existing, quantity: newQty };
        return { items: updatedItems };
      }

      return {
        items: [
          ...state.items,
          {
            id,
            productId,
            optionIds: [...optionIds].sort(),
            quantity: Math.min(99, quantity),
            ...(note?.trim() ? { note: note.trim() } : {}),
          },
        ],
      };
    }

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== action.id),
        };
      }
      return {
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, quantity: Math.min(99, action.quantity) } : item,
        ),
      };
    }

    case "REMOVE_ITEM": {
      return {
        items: state.items.filter((item) => item.id !== action.id),
      };
    }

    case "CLEAR_CART": {
      return { items: [] };
    }

    case "SET_CART": {
      return { items: action.items };
    }

    default:
      return state;
  }
}

const storedItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  optionIds: z.array(z.string()),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

const storedCartSchema = z.array(storedItemSchema);

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const result = storedCartSchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: readonly CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Graceful fallback for quota exceeded or private browsing
  }
}

export interface DerivedOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface DerivedCartLine {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  selectedOptions: DerivedOption[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface DerivedCart {
  lines: DerivedCartLine[];
  availableLines: DerivedCartLine[];
  unavailableLines: DerivedCartLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  totalItemCount: number;
  progressToFreeShipping: number;
  amountNeededForFreeShipping: number;
}

export function deriveCart(
  items: readonly CartItem[],
  menuProducts: readonly MenuProduct[],
  settings: { shippingFee: number; freeShippingThreshold: number },
  fulfillment: FulfillmentType = "DELIVERY",
): DerivedCart {
  const productMap = new Map(menuProducts.map((p) => [p.id, p]));
  const lines: DerivedCartLine[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      lines.push({
        id: item.id,
        productId: item.productId,
        productName: "Món không còn tồn tại",
        productImage: null,
        selectedOptions: [],
        quantity: item.quantity,
        unitPrice: 0,
        lineTotal: 0,
        note: item.note,
        isAvailable: false,
        unavailableReason: "Món này đã bị gỡ khỏi menu",
      });
      continue;
    }

    if (!product.isAvailable) {
      lines.push({
        id: item.id,
        productId: item.productId,
        productName: product.name,
        productImage: product.imageUrl,
        selectedOptions: [],
        quantity: item.quantity,
        unitPrice: product.basePrice,
        lineTotal: 0,
        note: item.note,
        isAvailable: false,
        unavailableReason: "Món tạm hết hàng",
      });
      continue;
    }

    // Resolve options
    const resolvedOptions: DerivedOption[] = [];
    let allOptionsValid = true;

    for (const optId of item.optionIds) {
      let foundOption: { id: string; name: string; priceDelta: number } | null = null;
      for (const group of product.optionGroups) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          foundOption = opt;
          break;
        }
      }

      if (!foundOption) {
        allOptionsValid = false;
        break;
      }

      resolvedOptions.push({
        id: foundOption.id,
        name: foundOption.name,
        priceDelta: foundOption.priceDelta,
      });
    }

    if (!allOptionsValid) {
      lines.push({
        id: item.id,
        productId: item.productId,
        productName: product.name,
        productImage: product.imageUrl,
        selectedOptions: resolvedOptions,
        quantity: item.quantity,
        unitPrice: product.basePrice,
        lineTotal: 0,
        note: item.note,
        isAvailable: false,
        unavailableReason: "Tuỳ chọn món đã thay đổi hoặc hết hàng",
      });
      continue;
    }

    const unitPrice =
      product.basePrice + resolvedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
    const lineTotal = unitPrice * item.quantity;

    lines.push({
      id: item.id,
      productId: item.productId,
      productName: product.name,
      productImage: product.imageUrl,
      selectedOptions: resolvedOptions,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      note: item.note,
      isAvailable: true,
    });
  }

  const availableLines = lines.filter((line) => line.isAvailable);
  const unavailableLines = lines.filter((line) => !line.isAvailable);

  const pricedLines: PricedLine[] = availableLines.map((l) => ({
    unitPrice: l.unitPrice,
    quantity: l.quantity,
  }));

  const totals = calculateTotals(pricedLines, fulfillment, settings);

  const totalItemCount = availableLines.reduce((sum, l) => sum + l.quantity, 0);

  const amountNeededForFreeShipping = Math.max(0, settings.freeShippingThreshold - totals.subtotal);

  const progressToFreeShipping = Math.min(
    100,
    Math.round((totals.subtotal / settings.freeShippingThreshold) * 100),
  );

  return {
    lines,
    availableLines,
    unavailableLines,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    total: totals.total,
    totalItemCount,
    progressToFreeShipping,
    amountNeededForFreeShipping,
  };
}

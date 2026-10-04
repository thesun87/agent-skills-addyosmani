import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  cartReducer,
  buildCartItemId,
  loadCartFromStorage,
  saveCartToStorage,
  deriveCart,
  CART_STORAGE_KEY,
  type CartState,
} from "@/features/cart/store";
import type { MenuProduct } from "@/features/menu/queries";

describe("Cart Reducer & Logic (C3, AD7)", () => {
  const sampleProducts: MenuProduct[] = [
    {
      id: "prod-1",
      name: "Cà phê sữa đá",
      description: "Cà phê Robusta Đắk Lắk",
      basePrice: 29000,
      imageUrl: null,
      isAvailable: true,
      categoryId: "cat-coffee",
      optionGroups: [
        {
          id: "grp-size",
          name: "Size",
          isRequired: true,
          maxSelect: 1,
          options: [
            { id: "opt-size-m", name: "Size M", priceDelta: 0 },
            { id: "opt-size-l", name: "Size L (+6k)", priceDelta: 6000 },
          ],
        },
        {
          id: "grp-topping",
          name: "Topping",
          isRequired: false,
          maxSelect: 2,
          options: [{ id: "opt-flan", name: "Bánh Flan", priceDelta: 10000 }],
        },
      ],
    },
    {
      id: "prod-soldout",
      name: "Trà đào",
      description: "Hết đào",
      basePrice: 35000,
      imageUrl: null,
      isAvailable: false,
      categoryId: "cat-tea",
      optionGroups: [],
    },
  ] as unknown as MenuProduct[];

  const defaultSettings = {
    shippingFee: 15000,
    freeShippingThreshold: 150000,
  };

  describe("buildCartItemId", () => {
    it("generates identical ID for same options in different order", () => {
      const id1 = buildCartItemId("prod-1", ["opt-2", "opt-1"], "ít ngọt");
      const id2 = buildCartItemId("prod-1", ["opt-1", "opt-2"], "ít ngọt");
      expect(id1).toBe(id2);
    });

    it("generates different ID for different notes or different options", () => {
      const id1 = buildCartItemId("prod-1", ["opt-1"], "ít ngọt");
      const id2 = buildCartItemId("prod-1", ["opt-1"], "nhiều ngọt");
      const id3 = buildCartItemId("prod-1", ["opt-2"], "ít ngọt");
      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
    });
  });

  describe("cartReducer", () => {
    const initialState: CartState = { items: [] };

    it("adds a new item to cart", () => {
      const nextState = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: {
          productId: "prod-1",
          optionIds: ["opt-size-m"],
          quantity: 2,
          note: "ít đá",
        },
      });

      expect(nextState.items).toHaveLength(1);
      expect(nextState.items[0]).toMatchObject({
        productId: "prod-1",
        optionIds: ["opt-size-m"],
        quantity: 2,
        note: "ít đá",
      });
    });

    it("merges quantity when adding identical product with same options and note", () => {
      const stateWithOne = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: {
          productId: "prod-1",
          optionIds: ["opt-size-m"],
          quantity: 2,
        },
      });

      const mergedState = cartReducer(stateWithOne, {
        type: "ADD_ITEM",
        item: {
          productId: "prod-1",
          optionIds: ["opt-size-m"],
          quantity: 3,
        },
      });

      expect(mergedState.items).toHaveLength(1);
      expect(mergedState.items[0].quantity).toBe(5);
    });

    it("creates separate lines for different options", () => {
      const s1 = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: { productId: "prod-1", optionIds: ["opt-size-m"], quantity: 1 },
      });
      const s2 = cartReducer(s1, {
        type: "ADD_ITEM",
        item: { productId: "prod-1", optionIds: ["opt-size-l"], quantity: 1 },
      });

      expect(s2.items).toHaveLength(2);
    });

    it("updates quantity of an item", () => {
      const s1 = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: { productId: "prod-1", optionIds: ["opt-size-m"], quantity: 1 },
      });
      const id = s1.items[0].id;

      const s2 = cartReducer(s1, {
        type: "UPDATE_QUANTITY",
        id,
        quantity: 4,
      });
      expect(s2.items[0].quantity).toBe(4);
    });

    it("removes item when quantity updated to 0 or negative", () => {
      const s1 = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: { productId: "prod-1", optionIds: ["opt-size-m"], quantity: 2 },
      });
      const id = s1.items[0].id;

      const s2 = cartReducer(s1, {
        type: "UPDATE_QUANTITY",
        id,
        quantity: 0,
      });
      expect(s2.items).toHaveLength(0);
    });

    it("removes item via REMOVE_ITEM", () => {
      const s1 = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: { productId: "prod-1", optionIds: ["opt-size-m"], quantity: 1 },
      });
      const id = s1.items[0].id;

      const s2 = cartReducer(s1, { type: "REMOVE_ITEM", id });
      expect(s2.items).toHaveLength(0);
    });

    it("clears cart via CLEAR_CART", () => {
      const s1 = cartReducer(initialState, {
        type: "ADD_ITEM",
        item: { productId: "prod-1", optionIds: ["opt-size-m"], quantity: 1 },
      });
      const s2 = cartReducer(s1, { type: "CLEAR_CART" });
      expect(s2.items).toHaveLength(0);
    });
  });

  describe("localStorage persistence resilience", () => {
    beforeEach(() => {
      localStorage.clear();
      vi.restoreAllMocks();
    });

    it("saves and loads items cleanly", () => {
      const items = [
        {
          id: "item-1",
          productId: "prod-1",
          optionIds: ["opt-size-m"],
          quantity: 2,
        },
      ];
      saveCartToStorage(items);
      const loaded = loadCartFromStorage();
      expect(loaded).toEqual(items);
    });

    it("handles corrupt localStorage json without crashing", () => {
      localStorage.setItem(CART_STORAGE_KEY, "invalid-json{{[");
      const loaded = loadCartFromStorage();
      expect(loaded).toEqual([]);
    });

    it("handles invalid schema items in localStorage", () => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ invalid: "data" }]));
      const loaded = loadCartFromStorage();
      expect(loaded).toEqual([]);
    });

    it("handles localStorage throwing security error gracefully", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: Access denied");
      });
      expect(() => loadCartFromStorage()).not.toThrow();
      expect(loadCartFromStorage()).toEqual([]);
    });
  });

  describe("deriveCart (re-deriving prices from menu, AD7)", () => {
    it("computes accurate unit price and line totals based on current menu", () => {
      const items = [
        {
          id: "line-1",
          productId: "prod-1",
          optionIds: ["opt-size-l", "opt-flan"], // +6k + 10k = 45k
          quantity: 2,
        },
      ];

      const derived = deriveCart(items, sampleProducts, defaultSettings, "DELIVERY");
      expect(derived.lines).toHaveLength(1);
      expect(derived.lines[0].unitPrice).toBe(45000); // 29k + 6k + 10k
      expect(derived.lines[0].lineTotal).toBe(90000); // 45k * 2
      expect(derived.subtotal).toBe(90000);
      expect(derived.shippingFee).toBe(15000); // below 150k threshold
      expect(derived.total).toBe(105000);
      expect(derived.amountNeededForFreeShipping).toBe(60000);
    });

    it("applies free shipping when subtotal reaches threshold", () => {
      const items = [
        {
          id: "line-1",
          productId: "prod-1",
          optionIds: ["opt-size-l"], // 35k
          quantity: 5, // 175k >= 150k
        },
      ];

      const derived = deriveCart(items, sampleProducts, defaultSettings, "DELIVERY");
      expect(derived.subtotal).toBe(175000);
      expect(derived.shippingFee).toBe(0);
      expect(derived.total).toBe(175000);
      expect(derived.amountNeededForFreeShipping).toBe(0);
      expect(derived.progressToFreeShipping).toBe(100);
    });

    it("excludes sold-out or missing products from subtotal and marks them unavailable", () => {
      const items = [
        {
          id: "line-1",
          productId: "prod-1",
          optionIds: ["opt-size-m"], // 29k
          quantity: 1,
        },
        {
          id: "line-soldout",
          productId: "prod-soldout",
          optionIds: [],
          quantity: 2,
        },
        {
          id: "line-missing",
          productId: "prod-deleted",
          optionIds: [],
          quantity: 1,
        },
      ];

      const derived = deriveCart(items, sampleProducts, defaultSettings, "PICKUP");
      expect(derived.lines).toHaveLength(3);
      expect(derived.availableLines).toHaveLength(1);
      expect(derived.unavailableLines).toHaveLength(2);
      expect(derived.subtotal).toBe(29000);
      expect(derived.total).toBe(29000); // pickup has no shipping
    });
  });
});

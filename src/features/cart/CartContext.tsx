"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  cartReducer,
  loadCartFromStorage,
  saveCartToStorage,
  type CartItem,
} from "./store";

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: {
    productId: string;
    optionIds: string[];
    quantity: number;
    note?: string;
  }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_EVENT = "tuanlinh_cart_updated";
const emptyItems: CartItem[] = [];
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = emptyItems;

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CART_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_EVENT, callback);
  };
}

function getClientSnapshot(): CartItem[] {
  if (typeof window === "undefined") return emptyItems;
  try {
    const raw = window.localStorage.getItem("tuanlinh_cart_v1");
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = loadCartFromStorage();
    }
    return cachedItems;
  } catch {
    return emptyItems;
  }
}

function getServerSnapshot(): CartItem[] {
  return emptyItems;
}

function notifyCartChange(items: CartItem[]) {
  cachedItems = items;
  cachedRaw = JSON.stringify(items);
  saveCartToStorage(items);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_EVENT));
  }
}

export interface CartProviderProps {
  children: React.ReactNode;
  initialItems?: CartItem[];
  initialIsOpen?: boolean;
}

export function CartProvider({
  children,
  initialItems,
  initialIsOpen = false,
}: CartProviderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialIsOpen);
  const [overrideItems, setOverrideItems] = useState<CartItem[] | null>(
    initialItems ?? null,
  );

  const syncedItems = useSyncExternalStore(
    subscribeToStorage,
    getClientSnapshot,
    getServerSnapshot,
  );

  const items = overrideItems !== null ? overrideItems : syncedItems;

  const addItem = useCallback(
    (item: {
      productId: string;
      optionIds: string[];
      quantity: number;
      note?: string;
    }) => {
      if (overrideItems !== null) {
        const next = cartReducer({ items: overrideItems }, { type: "ADD_ITEM", item });
        setOverrideItems(next.items);
      } else {
        const current = getClientSnapshot();
        const next = cartReducer({ items: current }, { type: "ADD_ITEM", item });
        notifyCartChange(next.items);
      }
      setIsDrawerOpen(true);
    },
    [overrideItems],
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (overrideItems !== null) {
        const next = cartReducer(
          { items: overrideItems },
          { type: "UPDATE_QUANTITY", id, quantity },
        );
        setOverrideItems(next.items);
      } else {
        const current = getClientSnapshot();
        const next = cartReducer(
          { items: current },
          { type: "UPDATE_QUANTITY", id, quantity },
        );
        notifyCartChange(next.items);
      }
    },
    [overrideItems],
  );

  const removeItem = useCallback(
    (id: string) => {
      if (overrideItems !== null) {
        const next = cartReducer(
          { items: overrideItems },
          { type: "REMOVE_ITEM", id },
        );
        setOverrideItems(next.items);
      } else {
        const current = getClientSnapshot();
        const next = cartReducer(
          { items: current },
          { type: "REMOVE_ITEM", id },
        );
        notifyCartChange(next.items);
      }
    },
    [overrideItems],
  );

  const clearCart = useCallback(() => {
    if (overrideItems !== null) {
      setOverrideItems([]);
    } else {
      notifyCartChange([]);
    }
  }, [overrideItems]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalCount,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalCount,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const fallbackContext: CartContextValue = {
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalCount: 0,
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
};

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  return ctx ?? fallbackContext;
}

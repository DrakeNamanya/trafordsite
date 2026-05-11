'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import type { ApiProduct } from './api';

/**
 * Client-side cart store backed by localStorage.
 *
 * No login is required to add to cart. The cart survives full page reloads
 * and direct URL navigation. At checkout time we POST the line items to
 * /api/public/orders/guest-checkout — the server computes totals and shipping
 * server-side so prices can't be tampered with client-side.
 */

export interface LocalCartLine {
  productId: string | number;
  quantity: number;
  /** Lightweight product snapshot so the cart page renders without a refetch. */
  product: {
    id: string | number;
    name: string;
    slug: string;
    price: number;
    unit: string;
    image_url: string | null;
    stock: number;
  };
}

const STORAGE_KEY = 'trafordsite.cart.v1';

interface CartContextValue {
  items: LocalCartLine[];
  itemCount: number;
  subtotal: number;
  isHydrated: boolean;
  addToCart: (product: ApiProduct, qty?: number) => void;
  updateQuantity: (productId: string | number, qty: number) => void;
  removeFromCart: (productId: string | number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readFromStorage(): LocalCartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalCartLine[];
  } catch {
    return [];
  }
}

function writeToStorage(items: LocalCartLine[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded / private mode — silently drop, the in-memory state still
    // works for this session.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalCartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on first client render so the badge count is
  // correct as soon as the page is interactive.
  useEffect(() => {
    setItems(readFromStorage());
    setIsHydrated(true);
  }, []);

  // Sync across browser tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setItems(readFromStorage());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: LocalCartLine[]) => {
    setItems(next);
    writeToStorage(next);
  }, []);

  const addToCart = useCallback(
    (product: ApiProduct, qty: number = 1) => {
      const idx = items.findIndex((it) => it.productId === product.id);
      let next: LocalCartLine[];
      if (idx >= 0) {
        next = items.slice();
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
      } else {
        next = [
          ...items,
          {
            productId: product.id,
            quantity: qty,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              unit: product.unit,
              image_url: product.image_url,
              stock: product.stock,
            },
          },
        ];
      }
      persist(next);
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    (productId: string | number, qty: number) => {
      if (qty <= 0) {
        persist(items.filter((it) => it.productId !== productId));
        return;
      }
      persist(
        items.map((it) =>
          it.productId === productId ? { ...it, quantity: qty } : it
        )
      );
    },
    [items, persist]
  );

  const removeFromCart = useCallback(
    (productId: string | number) => {
      persist(items.filter((it) => it.productId !== productId));
    },
    [items, persist]
  );

  const clearCart = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
    const subtotal = items.reduce(
      (sum, it) => sum + it.product.price * it.quantity,
      0
    );
    return {
      items,
      itemCount,
      subtotal,
      isHydrated,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    };
  }, [items, isHydrated, addToCart, updateQuantity, removeFromCart, clearCart]);

  // Using createElement instead of JSX so this file can stay .ts (not .tsx).
  return createElement(CartContext.Provider, { value }, children);
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return ctx;
}

'use client';

import type { ReactNode } from 'react';
import { CartProvider } from '@/lib/cart-store';

/**
 * Client boundary for the localStorage-backed cart store.
 * The root layout is a Server Component, so the provider has to live in
 * its own 'use client' file before it can wrap the page tree.
 */
export function CartProviderRoot({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

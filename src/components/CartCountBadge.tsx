'use client';

import { useCart } from '@/lib/cart-store';

/**
 * Live cart-count display, sourced from the localStorage-backed CartProvider.
 *
 * Reads from the new client-side cart store so it works for unauthenticated
 * guests (which is the default now that we route checkout through
 * /api/public/orders/guest-checkout). Updates automatically whenever the
 * store changes — no Supabase realtime required.
 */
export function CartCountBadge({
  variant = 'badge',
}: {
  variant?: 'badge' | 'text';
}) {
  const { itemCount, isHydrated } = useCart();
  const count = isHydrated ? itemCount : 0;

  if (variant === 'text') {
    return <span suppressHydrationWarning>{count}</span>;
  }

  if (!isHydrated || count === 0) return null;
  return (
    <span
      suppressHydrationWarning
      className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-traford-red text-[10px] font-bold text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

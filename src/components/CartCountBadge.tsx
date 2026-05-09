'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Live cart-count display, refreshes when cart_items changes via Supabase Realtime.
 * Renders either as a small red badge (variant="badge") or inline text (variant="text").
 *
 * Reads from the cart_items table for the current user. For unauthenticated users
 * we fall back to localStorage (matches reference site UX).
 */
export function CartCountBadge({
  variant = 'badge',
}: {
  variant?: 'badge' | 'text';
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Authenticated: count from Supabase
        const { data } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id);
        const total = (data ?? []).reduce(
          (sum, row: { quantity: number }) => sum + (row.quantity ?? 1),
          0
        );
        setCount(total);
      } else {
        // Guest: read localStorage (set by client-side cart actions)
        try {
          const raw = localStorage.getItem('tf_cart');
          const parsed = raw ? JSON.parse(raw) : [];
          const total = Array.isArray(parsed)
            ? parsed.reduce(
                (sum: number, row: { quantity?: number }) =>
                  sum + (row.quantity ?? 1),
                0
              )
            : 0;
          setCount(total);
        } catch {
          setCount(0);
        }
      }
    };

    fetchCount();

    // Subscribe to cart_items changes for live updates
    const channel = supabase
      .channel('cart-count-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items' },
        () => fetchCount()
      )
      .subscribe();

    // Also re-read on storage events (multi-tab sync for guests)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tf_cart') fetchCount();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (variant === 'text') {
    return <span>{count}</span>;
  }

  // badge variant: small red circle, hidden when count = 0
  if (count === 0) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-traford-red text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

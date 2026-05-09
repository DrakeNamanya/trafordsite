'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Live cart-count display, refreshes when cart_items changes via Supabase Realtime.
 *
 * SSR/Hydration: we render `0` (or null badge) on first paint to match SSR,
 * and only update state after `mounted` becomes true.
 *
 * Realtime: Supabase forbids calling `.on()` after `.subscribe()`. We must
 * therefore (a) attach all listeners before subscribing, and (b) only subscribe
 * once per channel. Each effect run uses a fresh channel name and tears down
 * the previous one in cleanup. Errors in the realtime path are swallowed so a
 * websocket hiccup can never crash the entire page.
 */
export function CartCountBadge({
  variant = 'badge',
}: {
  variant?: 'badge' | 'text';
}) {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setMounted(true);

    const supabase = createClient();
    let cancelled = false;

    const computeFromLocal = (): number => {
      try {
        const raw = window.localStorage.getItem('tf_cart');
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return 0;
        return parsed.reduce(
          (sum: number, row: { quantity?: number }) =>
            sum + (row.quantity ?? 1),
          0
        );
      } catch {
        return 0;
      }
    };

    const fetchCount = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (user) {
          const { data, error } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id);
          if (error) throw error;
          const total = (data ?? []).reduce(
            (sum, row: { quantity: number }) => sum + (row.quantity ?? 1),
            0
          );
          if (!cancelled) setCount(total);
        } else {
          if (!cancelled) setCount(computeFromLocal());
        }
      } catch {
        if (!cancelled) setCount(0);
      }
    };

    fetchCount();

    // Realtime subscription — wrap in try/catch so any realtime error
    // (websocket blocked, RLS, etc) never crashes the page.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      // Unique channel name per component instance, so Strict Mode's double
      // mount in dev doesn't clash with the previous channel.
      const name = `cart-count-${Math.random().toString(36).slice(2, 10)}`;
      channel = supabase.channel(name);
      // Attach the listener BEFORE calling subscribe(). Calling on() after
      // subscribe() is a runtime error in supabase-js v2.
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items' },
        () => {
          if (!cancelled) fetchCount();
        }
      );
      channel.subscribe();
    } catch {
      // Realtime not available — fall back to localStorage events only.
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tf_cart' && !cancelled) fetchCount();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  if (variant === 'text') {
    return <span suppressHydrationWarning>{mounted ? count : 0}</span>;
  }

  if (!mounted || count === 0) return null;
  return (
    <span
      suppressHydrationWarning
      className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-traford-red text-[10px] font-bold text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

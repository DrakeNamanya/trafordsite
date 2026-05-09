'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Live cart-count display, refreshes when cart_items changes via Supabase Realtime.
 * Renders either as a small red badge (variant="badge") or inline text (variant="text").
 *
 * IMPORTANT: We render `null` (or "0") on first paint to match what SSR produces,
 * then we update from localStorage / Supabase only AFTER `mounted` is true.
 * Without this guard, useState(0) on the server renders "0" into the HTML, then
 * the client reads localStorage and may produce a different value, causing a
 * hydration mismatch (React error #418) and a client-side exception.
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

    const fetchCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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
        try {
          const raw =
            typeof window !== 'undefined'
              ? window.localStorage.getItem('tf_cart')
              : null;
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

    const channel = supabase
      .channel('cart-count-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items' },
        () => fetchCount()
      )
      .subscribe();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tf_cart') fetchCount();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }, []);

  if (variant === 'text') {
    // Always render "0" on server and on first client paint to keep markup
    // identical between SSR and the initial client render.
    return <span suppressHydrationWarning>{mounted ? count : 0}</span>;
  }

  // badge variant: hidden until mounted (matches SSR which never renders the badge)
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

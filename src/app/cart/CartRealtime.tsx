'use client';

import { useRealtimeRefresh } from '@/hooks/useRealtime';

/**
 * Subscribes to the current user's cart_items rows. When the cart changes
 * (add/remove/quantity edit elsewhere — e.g. mobile app), the cart page
 * Server Component re-fetches fresh data.
 */
export function CartRealtime({ userId }: { userId: string }) {
  useRealtimeRefresh({
    table: 'cart_items',
    filter: `user_id=eq.${userId}`,
  });
  return null;
}

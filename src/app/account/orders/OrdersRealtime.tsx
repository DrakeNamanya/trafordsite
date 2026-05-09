'use client';

import { useRealtimeRefresh } from '@/hooks/useRealtime';

/**
 * Subscribes to the current user's orders and refreshes the Server Component
 * tree when a row is inserted/updated/deleted. Mounted invisibly inside the
 * orders list page.
 */
export function OrdersRealtime({ userId }: { userId: string }) {
  useRealtimeRefresh({
    table: 'orders',
    filter: `user_id=eq.${userId}`,
  });
  return null;
}

'use client';

import { useRealtimeRefresh } from '@/hooks/useRealtime';

/**
 * Subscribes to live changes for a single order: the order row itself,
 * its payments, deliveries, and delivery_events. Any change triggers a
 * `router.refresh()` so the Server Component re-renders with fresh data.
 */
export function OrderDetailRealtime({ orderId }: { orderId: string }) {
  useRealtimeRefresh({
    table: 'orders',
    filter: `id=eq.${orderId}`,
  });
  useRealtimeRefresh({
    table: 'payments',
    filter: `order_id=eq.${orderId}`,
  });
  useRealtimeRefresh({
    table: 'deliveries',
    filter: `order_id=eq.${orderId}`,
  });
  useRealtimeRefresh({
    table: 'delivery_events',
    filter: `order_id=eq.${orderId}`,
  });
  return null;
}

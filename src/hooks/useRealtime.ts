'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

type ChangeHandler<T extends Record<string, unknown> = Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

interface SubscribeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string; // e.g. "user_id=eq.<uuid>"
  onChange: ChangeHandler;
}

/**
 * Subscribe to Postgres CDC changes on a Supabase table.
 *
 * The handler is kept in a ref so updating it between renders does not tear
 * down and re-subscribe the channel.
 */
export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onChange,
}: SubscribeOptions) {
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();
    const channelName = `public:${table}:${filter ?? 'all'}`;

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on(
        'postgres_changes' as never,
        { event, schema: 'public', table, filter },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
          handlerRef.current(payload)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}

/**
 * Convenience hook: refresh the current Server Component tree any time a
 * change lands. Use it on order detail / orders list / cart pages so the
 * server-rendered data stays live without a full page reload.
 */
export function useRealtimeRefresh(opts: Omit<SubscribeOptions, 'onChange'>) {
  const router = useRouter();
  useRealtimeSubscription({
    ...opts,
    onChange: () => router.refresh(),
  });
}

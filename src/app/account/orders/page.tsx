import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatUGX, formatDate } from '@/lib/format';
import type { Order } from '@/lib/supabase/types';
import { OrdersRealtime } from './OrdersRealtime';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/orders');

  // Wrap the query so a row-level-security / schema mismatch / network blip
  // never propagates as an unhandled exception → CF Pages "Internal Server
  // Error". On failure we just render the empty state.
  //
  // ALSO match the user's phone (from profiles.shipping_phone on the order
  // row) so that orders placed via guest-checkout — which links to a
  // different profile id keyed off phone — still surface here.
  let orders: Order[] = [];
  let queryError: string | null = null;
  try {
    // Load profile phone so we can OR against shipping_phone.
    let userPhone: string | null = null;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();
      const p = (profileData as { phone?: string | null } | null)?.phone;
      if (typeof p === 'string' && p.length > 0) userPhone = p;
    } catch {
      /* non-fatal */
    }

    const orFilters: string[] = [`user_id.eq.${user.id}`];
    if (userPhone) orFilters.push(`shipping_phone.eq.${userPhone}`);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(orFilters.join(','))
      .order('created_at', { ascending: false });
    if (error) {
      queryError = error.message;
    } else {
      orders = (data ?? []) as Order[];
    }
  } catch (err) {
    queryError = err instanceof Error ? err.message : 'Failed to load orders';
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <OrdersRealtime userId={user.id} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold sm:text-3xl">My orders</h1>
        <Link href="/account" className="text-sm text-traford-muted hover:text-traford-orange">
          ← Back
        </Link>
      </div>

      {queryError && (
        <div className="card mb-4 border-amber-200 bg-amber-50 text-sm text-amber-900">
          We couldn&apos;t load your latest orders right now. Please refresh in
          a moment.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card text-center">
          <Package className="mx-auto h-10 w-10 text-traford-muted" />
          <p className="mt-3 text-traford-muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="btn-primary mt-4">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="card flex items-center justify-between gap-3 transition hover:border-traford-orange"
            >
              <div>
                <div className="font-semibold text-traford-dark">
                  {order.order_number}
                </div>
                <div className="text-xs text-traford-muted">
                  {formatDate(order.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-traford-orange">
                  {formatUGX(Number(order.total ?? 0))}
                </div>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabel(order.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

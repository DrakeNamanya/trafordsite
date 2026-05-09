import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatUGX, formatDate } from '@/lib/format';
import type { Order } from '@/lib/supabase/types';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/orders');

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold sm:text-3xl">My orders</h1>
        <Link href="/account" className="text-sm text-traford-muted hover:text-traford-orange">
          ← Back
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center">
          <Package className="mx-auto h-10 w-10 text-traford-muted" />
          <p className="mt-3 text-traford-muted">You haven't placed any orders yet.</p>
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
                  {formatUGX(order.total)}
                </div>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

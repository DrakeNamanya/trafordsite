import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatUGX, formatDate } from '@/lib/format';
import type { Order, OrderItem } from '@/lib/supabase/types';
import { OrderDetailRealtime } from './OrderDetailRealtime';


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

interface OrderDetailProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/account/orders/${id}`);

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!orderData) notFound();
  const order = orderData as Order;

  const { data: itemsData } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  const items = (itemsData ?? []) as OrderItem[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <OrderDetailRealtime orderId={order.id} />
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/account/orders"
          className="text-sm text-traford-muted hover:text-traford-orange"
        >
          ← All orders
        </Link>
      </div>

      <div className="card space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-traford-muted">
              Order
            </div>
            <h1 className="text-xl font-extrabold">{order.order_number}</h1>
            <div className="text-xs text-traford-muted">
              Placed {formatDate(order.created_at)}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-800'
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="card mt-4 space-y-3">
        <h2 className="text-sm font-bold">Items</h2>
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b border-traford-border pb-2 last:border-0 last:pb-0"
          >
            <div>
              <div className="text-sm font-semibold">{item.product_name}</div>
              <div className="text-xs text-traford-muted">
                {formatUGX(item.unit_price)} × {item.quantity}
              </div>
            </div>
            <div className="text-sm font-bold">{formatUGX(item.line_total)}</div>
          </div>
        ))}
      </div>

      <div className="card mt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={formatUGX(order.subtotal)} />
        <Row label="Shipping" value={formatUGX(order.shipping_cost)} />
        {order.tax > 0 && <Row label="Tax" value={formatUGX(order.tax)} />}
        <div className="border-t border-traford-border pt-2">
          <Row label="Total" value={formatUGX(order.total)} bold />
        </div>
      </div>

      {order.notes && (
        <div className="card mt-4">
          <h2 className="mb-1 text-sm font-bold">Notes</h2>
          <p className="text-sm text-traford-muted">{order.notes}</p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold ? 'text-base font-bold' : ''
      }`}
    >
      <span className={bold ? '' : 'text-traford-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

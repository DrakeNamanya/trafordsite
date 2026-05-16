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

  // Pull the user's phone so we can also match orders placed via
  // guest-checkout (linked to a separate profile id keyed off phone).
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

  // Try matching by either user_id or shipping_phone.
  let orderData: Record<string, unknown> | null = null;
  try {
    const orFilters: string[] = [`user_id.eq.${user.id}`];
    if (userPhone) orFilters.push(`shipping_phone.eq.${userPhone}`);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .or(orFilters.join(','))
      .maybeSingle();
    orderData = (data as Record<string, unknown> | null) ?? null;
  } catch {
    orderData = null;
  }

  if (!orderData) notFound();
  const order = orderData as unknown as Order;

  let items: OrderItem[] = [];
  try {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    items = (itemsData ?? []) as OrderItem[];
  } catch {
    items = [];
  }

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
        {items.map((item) => {
          // Production schema stores per-line total in `subtotal`. Some
          // legacy rows used `line_total`. Fall back across both so we
          // never feed `undefined` into `formatUGX` (which crashed the page).
          const lineTotal =
            (item as { subtotal?: number; line_total?: number }).subtotal ??
            (item as { subtotal?: number; line_total?: number }).line_total ??
            Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-traford-border pb-2 last:border-0 last:pb-0"
            >
              <div>
                <div className="text-sm font-semibold">{item.product_name}</div>
                <div className="text-xs text-traford-muted">
                  {formatUGX(Number(item.unit_price ?? 0))} × {item.quantity}
                </div>
              </div>
              <div className="text-sm font-bold">
                {formatUGX(Number(lineTotal))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={formatUGX(Number(order.subtotal ?? 0))} />
        <Row
          label="Shipping"
          value={formatUGX(
            Number(
              (order as { shipping_fee?: number; shipping_cost?: number })
                .shipping_fee ??
                (order as { shipping_fee?: number; shipping_cost?: number })
                  .shipping_cost ??
                0,
            ),
          )}
        />
        {Number(order.tax ?? 0) > 0 && (
          <Row label="Tax" value={formatUGX(Number(order.tax))} />
        )}
        <div className="border-t border-traford-border pt-2">
          <Row label="Total" value={formatUGX(Number(order.total ?? 0))} bold />
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

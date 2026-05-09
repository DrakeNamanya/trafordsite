import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from './CheckoutForm';
import { formatUGX } from '@/lib/format';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface CartRow {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    stock: number;
    audience: string;
  } | null;
}

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/checkout');

  const { data } = await supabase
    .from('cart_items')
    .select('id, quantity, product:products(id, name, price, unit, stock, audience)')
    .eq('user_id', user.id);

  const items = ((data ?? []) as unknown as CartRow[]).filter(
    (i) => i.product !== null
  );

  if (items.length === 0) {
    redirect('/cart');
  }

  const subtotal = items.reduce(
    (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const shipping = 5000;
  const total = subtotal + shipping;

  // Build payload for the RPC
  const rpcItems = items.map((i) => ({
    product_id: i.product!.id,
    quantity: i.quantity,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm items={rpcItems} total={total} />
        </div>

        <aside className="card h-fit space-y-3 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="space-y-2">
            {items.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate">
                  {i.product?.name} × {i.quantity}
                </span>
                <span className="font-semibold">
                  {formatUGX((i.product?.price ?? 0) * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-traford-border pt-3 text-sm">
            <Row label="Subtotal" value={formatUGX(subtotal)} />
            <Row label="Shipping" value={formatUGX(shipping)} />
            <div className="mt-2 border-t border-traford-border pt-2">
              <Row label="Total" value={formatUGX(total)} bold />
            </div>
          </div>
        </aside>
      </div>
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
        bold ? 'font-bold text-base' : ''
      }`}
    >
      <span className={bold ? '' : 'text-traford-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

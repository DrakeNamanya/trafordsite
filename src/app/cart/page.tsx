import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatUGX } from '@/lib/format';
import { CartItemRow } from './CartItemRow';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface CartRow {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    unit: string;
    image_url: string | null;
    stock: number;
  } | null;
}

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-traford-muted" />
        <h1 className="mt-4 text-2xl font-bold">Your cart</h1>
        <p className="mt-2 text-traford-muted">
          Sign in to view items in your cart.
        </p>
        <Link href="/login?redirect=/cart" className="btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  const { data } = await supabase
    .from('cart_items')
    .select(
      'id, quantity, product:products(id, name, slug, price, unit, image_url, stock)'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items = ((data ?? []) as unknown as CartRow[]).filter(
    (i) => i.product !== null
  );

  const subtotal = items.reduce(
    (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const shipping = subtotal > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-traford-muted" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-traford-muted">
          Browse fresh products and add them to your cart.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Your cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              cartItemId={item.id}
              quantity={item.quantity}
              product={item.product!}
            />
          ))}
        </div>

        {/* Summary */}
        <aside className="card h-fit space-y-3 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Order summary</h2>
          <Row label="Subtotal" value={formatUGX(subtotal)} />
          <Row label="Shipping" value={formatUGX(shipping)} />
          <div className="border-t border-traford-border pt-3">
            <Row label="Total" value={formatUGX(total)} bold />
          </div>
          <Link href="/checkout" className="btn-primary w-full">
            Checkout
          </Link>
          <Link
            href="/shop"
            className="block text-center text-sm text-traford-muted hover:text-traford-orange"
          >
            Continue shopping
          </Link>
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
      className={`flex items-center justify-between text-sm ${
        bold ? 'font-bold text-base' : ''
      }`}
    >
      <span className={bold ? '' : 'text-traford-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

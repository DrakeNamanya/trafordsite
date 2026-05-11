'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { formatUGX } from '@/lib/format';
import { CartItemRow } from './CartItemRow';

/**
 * Guest-friendly cart page. All state lives in localStorage via useCart().
 * No login required.
 */
export default function CartPage() {
  const { items, subtotal, isHydrated } = useCart();

  // While hydrating from localStorage, render a stable skeleton to avoid
  // a flash of "empty cart" for users who actually have items stored.
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-traford-muted" />
        <h1 className="mt-4 text-2xl font-bold">Your cart</h1>
        <p className="mt-2 text-traford-muted">Loading…</p>
      </div>
    );
  }

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

  const shipping = subtotal > 0 ? 5000 : 0;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Your cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <CartItemRow
              key={String(item.productId)}
              productId={item.productId}
              quantity={item.quantity}
              product={item.product}
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

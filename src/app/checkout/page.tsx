'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { formatUGX } from '@/lib/format';
import { CheckoutForm } from './CheckoutForm';

/**
 * Guest-friendly checkout page. Reads cart entirely from localStorage via
 * useCart() — no auth gate.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, isHydrated, clearCart } = useCart();

  // If the user lands here with an empty cart, bounce them to /cart.
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.replace('/cart');
    }
  }, [isHydrated, items.length, router]);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-traford-muted">Loading checkout…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // redirect is in-flight
  }

  const rpcItems = items.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* CheckoutForm handles its own shipping math based on the delivery
              method selection — we just hand it the subtotal. */}
          <CheckoutForm
            items={rpcItems}
            subtotal={subtotal}
            onSuccess={() => clearCart()}
          />
        </div>

        <aside className="card h-fit space-y-3 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="space-y-2">
            {items.map((i) => (
              <div
                key={String(i.productId)}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate">
                  {i.product.name} × {i.quantity}
                </span>
                <span className="font-semibold">
                  {formatUGX(i.product.price * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-traford-border pt-3 text-sm">
            <Row label="Subtotal" value={formatUGX(subtotal)} />
            <p className="mt-2 text-[11px] text-traford-muted">
              Shipping is calculated from your selected delivery method.
            </p>
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

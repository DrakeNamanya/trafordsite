'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guestCheckout, type GuestCheckoutItem } from '@/lib/api';

type PaymentMethod =
  | 'mtn_momo'
  | 'airtel_money'
  | 'flexipay'
  | 'cash_on_delivery';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'airtel_money', label: 'Airtel Money', icon: '📲' },
  { value: 'flexipay', label: 'FlexiPay', icon: '💳' },
  { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵' },
];

interface Item {
  product_id: string | number;
  quantity: number;
}

export function CheckoutForm({
  items,
  total,
  onSuccess,
}: {
  items: Item[];
  total: number;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Kampala');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('mtn_momo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setPending(true);
    try {
      const checkoutItems: GuestCheckoutItem[] = items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      }));

      const composedNotes = [`Payment method: ${payment}`, notes.trim()]
        .filter(Boolean)
        .join(' — ');

      const response = await guestCheckout({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        delivery_address: addressLine.trim(),
        delivery_city: city.trim() || undefined,
        notes: composedNotes,
        items: checkoutItems,
      });

      const number =
        response.order_number ??
        response.order?.order_number ??
        null;

      // Clear the local cart now that the order is safely on the server.
      onSuccess?.();

      if (number) {
        setOrderNumber(number);
      } else {
        // Fallback: bounce to home if the API didn't return an order number.
        router.push('/');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to place order. Please try again.'
      );
    } finally {
      setPending(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="card space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-traford-mint text-3xl">
          ✅
        </div>
        <h2 className="text-xl font-extrabold">Order placed!</h2>
        <p className="text-sm text-traford-muted">
          Thank you{fullName ? `, ${fullName.split(' ')[0]}` : ''}. We&apos;ll be
          in touch shortly to confirm delivery.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-traford-orange/10 px-4 py-2 text-sm font-bold text-traford-orange">
          <span className="opacity-70">Order #</span>
          <span>{orderNumber}</span>
        </div>
        <div className="text-sm">
          Total:{' '}
          <span className="font-bold">
            UGX {total.toLocaleString('en-UG')}
          </span>
        </div>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <a href="/shop" className="btn-primary">
            Continue shopping
          </a>
          <a
            href="/"
            className="rounded-full border border-traford-border px-5 py-2 text-sm font-semibold hover:bg-traford-bg"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card space-y-4">
        <h2 className="text-lg font-bold">Delivery details</h2>
        <Field
          label="Full name"
          value={fullName}
          onChange={setFullName}
          required
        />
        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+256 7XX XXX XXX"
          required
        />
        <Field
          label="Email (optional)"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <Field
          label="Address"
          value={addressLine}
          onChange={setAddressLine}
          required
        />
        <Field label="City" value={city} onChange={setCity} required />
        <Field
          label="Order notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="Gate code, landmarks, delivery instructions…"
          textarea
        />
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Payment method</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                payment === opt.value
                  ? 'border-traford-orange bg-traford-mint'
                  : 'border-traford-border bg-white hover:bg-traford-bg'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={opt.value}
                checked={payment === opt.value}
                onChange={() => setPayment(opt.value)}
                className="accent-traford-orange"
              />
              <span className="text-xl">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full text-base"
      >
        {pending
          ? 'Placing order…'
          : `Place order — UGX ${total.toLocaleString('en-UG')}`}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-traford-dark">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-2xl border border-traford-border bg-white px-4 py-2.5 text-sm outline-none focus:border-traford-orange"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-full border border-traford-border bg-white px-4 py-2.5 text-sm outline-none focus:border-traford-orange"
        />
      )}
    </label>
  );
}

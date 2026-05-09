'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PaymentMethod } from '@/lib/supabase/types';

interface Item {
  product_id: string;
  quantity: number;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'airtel_money', label: 'Airtel Money', icon: '📲' },
  { value: 'flexipay', label: 'FlexiPay', icon: '💳' },
  { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵' },
];

export function CheckoutForm({ items, total }: { items: Item[]; total: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Kampala');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('mtn_momo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('create_order', {
        p_items: items,
        p_payment_method: payment,
        p_shipping_full_name: fullName,
        p_shipping_phone: phone,
        p_shipping_address_line: addressLine,
        p_shipping_city: city,
        p_notes: notes,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const orderId = (data as { order_id?: string } | null)?.order_id;
      router.push(orderId ? `/account/orders/${orderId}` : '/account/orders');
    });
  };

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
        {pending ? 'Placing order…' : `Place order — UGX ${total.toLocaleString('en-UG')}`}
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

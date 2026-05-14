'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  Wallet,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { guestCheckout, type GuestCheckoutItem } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { formatUGX } from '@/lib/format';

/**
 * Website checkout — mirrors the Flutter `checkout_screen.dart` EXACTLY so
 * the website and mobile app share one checkout contract:
 *
 *   - Delivery method toggle: 'delivery' (charges UGX 5,000) or 'pickup'
 *     (free; defaults the address to the Kikaaya, Kyebando, Kawempe outlet).
 *   - Payment methods: cash on delivery / mobile money / card (matches
 *     Flutter's three radio options).
 *   - Pre-fills full_name / phone / email / address from the signed-in
 *     `profiles` row (and resolves district/subcounty/parish/village names
 *     via the location tables, same as the Flutter LocationService).
 *   - Posts to the same /api/public/orders/guest-checkout endpoint the
 *     Flutter app hits, which writes to public.orders (one customer_orders
 *     table for both clients) and the admin portal Customer orders tab.
 *   - `delivery_method` is sent so the server zeros out the shipping fee
 *     for pickup orders, matching the Flutter behaviour.
 */

const HOME_DELIVERY_FEE = 5000;
const PICKUP_ADDRESS =
  'Pickup at Traford outlet (Kikaaya, Kyebando, Kawempe)';

type DeliveryMethod = 'delivery' | 'pickup';
type PaymentMethod = 'cash' | 'mobile' | 'card';

interface Item {
  product_id: string | number;
  quantity: number;
}

export function CheckoutForm({
  items,
  subtotal,
  onSuccess,
}: {
  items: Item[];
  subtotal: number;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [signedInName, setSignedInName] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const shipping = deliveryMethod === 'pickup' ? 0 : HOME_DELIVERY_FEE;
  const total = subtotal + shipping;

  // Pre-fill from the signed-in profile (mirrors Flutter `_checkUserProfile`).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) setProfileLoaded(true);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'full_name, phone, email, district_id, subcounty_id, parish_id'
          )
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;

        if (profile) {
          if (typeof profile.full_name === 'string') {
            setFullName(profile.full_name);
            setSignedInName(profile.full_name);
          }
          if (typeof profile.phone === 'string') setPhone(profile.phone);
          if (
            typeof profile.email === 'string' &&
            !profile.email.endsWith('@phone.trafordfresh.local')
          ) {
            setEmail(profile.email);
          }

          // Resolve "parish, subcounty, district" same as Flutter does
          const districtId = profile.district_id as number | null;
          const subcountyId = profile.subcounty_id as number | null;
          const parishId = profile.parish_id as number | null;
          const [dRes, sRes, pRes] = await Promise.all([
            districtId
              ? supabase.from('districts').select('name').eq('id', districtId).maybeSingle()
              : Promise.resolve({ data: null }),
            subcountyId
              ? supabase.from('subcounties').select('name').eq('id', subcountyId).maybeSingle()
              : Promise.resolve({ data: null }),
            parishId
              ? supabase.from('parishes').select('name').eq('id', parishId).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);
          if (cancelled) return;
          const dName = (dRes.data as { name?: string } | null)?.name ?? '';
          const sName = (sRes.data as { name?: string } | null)?.name ?? '';
          const pName = (pRes.data as { name?: string } | null)?.name ?? '';
          if (dName) {
            setAddressLine([pName, sName, dName].filter(Boolean).join(', '));
          }
        }
      } catch {
        // Guest checkout — ignore.
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Full name is required';
    const p = phone.trim();
    if (!p) return 'Phone is required';
    if (!p.startsWith('256')) return 'Phone must start with 256';
    if (p.length < 12) return 'Enter the full 12-digit number (256XXXXXXXXX)';
    if (!/^\d+$/.test(p)) return 'Phone must contain digits only';
    const e = email.trim();
    if (e && (!e.includes('@') || !e.includes('.'))) {
      return 'Enter a valid email';
    }
    if (deliveryMethod === 'delivery' && !addressLine.trim()) {
      return 'Delivery address is required';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    startTransition(async () => {
      try {
        const checkoutItems: GuestCheckoutItem[] = items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        }));

        const typedAddress = addressLine.trim();
        const deliveryAddress =
          deliveryMethod === 'pickup'
            ? typedAddress || PICKUP_ADDRESS
            : typedAddress;

        const response = await guestCheckout({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          delivery_address: deliveryAddress,
          delivery_city: 'Uganda',
          notes: `Payment method: ${paymentMethod}`,
          items: checkoutItems,
          delivery_method: deliveryMethod,
        });

        const number =
          response.order_number ?? response.order?.order_number ?? null;
        const responseTotal =
          (response.total as number | undefined) ??
          (response.order?.total as number | undefined) ??
          total;

        onSuccess?.();

        if (number) {
          setOrderNumber(number);
          setOrderTotal(responseTotal);
        } else {
          router.push('/');
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to place order. Please try again.'
        );
      }
    });
  };

  // ---- SUCCESS STATE -------------------------------------------------------
  if (orderNumber) {
    return (
      <div className="card space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-traford-mint">
          <CheckCircle2 className="h-8 w-8 text-traford-green" />
        </div>
        <h2 className="text-xl font-extrabold">Order placed!</h2>
        <p className="text-sm text-traford-muted">
          Thank you{fullName ? `, ${fullName.split(' ')[0]}` : ''}. We&apos;ll be
          in touch shortly to confirm
          {deliveryMethod === 'pickup' ? ' pickup' : ' delivery'} details.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-traford-orange/10 px-4 py-2 text-sm font-bold text-traford-orange">
          <span className="opacity-70">Order #</span>
          <span>{orderNumber}</span>
        </div>
        <div className="text-sm">
          Total:{' '}
          <span className="font-bold">
            UGX {orderTotal.toLocaleString('en-UG')}
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

  // ---- LOADING STATE -------------------------------------------------------
  if (!profileLoaded) {
    return (
      <div className="card text-center text-sm text-traford-muted">
        Checking your account…
      </div>
    );
  }

  // ---- FORM ----------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {signedInName && (
        <div className="flex items-center gap-2 rounded-lg border border-traford-mint bg-traford-mint/40 px-3 py-2 text-sm font-medium text-traford-green">
          <CheckCircle2 className="h-4 w-4" />
          Ordering as {signedInName}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Delivery Information */}
      <Section title="Delivery Information">
        <Field label="Full Name *" value={fullName} onChange={setFullName} />
        <Field
          label="Email (optional)"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
        />
        <Field
          label={
            deliveryMethod === 'pickup'
              ? 'Delivery Address (not required for pickup)'
              : 'Delivery Address *'
          }
          value={addressLine}
          onChange={setAddressLine}
          placeholder={
            deliveryMethod === 'pickup'
              ? PICKUP_ADDRESS
              : 'Enter your delivery address'
          }
          disabled={deliveryMethod === 'pickup'}
        />
        <Field
          label="Country"
          value="Uganda"
          onChange={() => undefined}
          disabled
        />
        <Field
          label="Phone Number *"
          value={phone}
          onChange={setPhone}
          placeholder="256XXXXXXXXX"
          inputMode="tel"
          maxLength={12}
        />
      </Section>

      {/* SECTION 2: Delivery Method (mirrors Flutter "Delivery Method") */}
      <Section title="Delivery Method">
        <RadioRow
          icon={<Truck className="h-5 w-5 text-traford-orange" />}
          title="Home Delivery"
          subtitle="We bring it to your address"
          trailing={`UGX ${formatUGX(HOME_DELIVERY_FEE)}`}
          trailingClass="text-traford-orange"
          checked={deliveryMethod === 'delivery'}
          onClick={() => setDeliveryMethod('delivery')}
        />
        <Divider />
        <RadioRow
          icon={<Store className="h-5 w-5 text-traford-orange" />}
          title="Pickup at Outlet"
          subtitle="Collect at Kikaaya, Kyebando, Kawempe"
          trailing="Free"
          trailingClass="text-traford-green"
          checked={deliveryMethod === 'pickup'}
          onClick={() => setDeliveryMethod('pickup')}
        />
      </Section>

      {/* SECTION 3: Payment Method (mirrors Flutter "Payment Method") */}
      <Section title="Payment Method">
        <RadioRow
          icon={<Wallet className="h-5 w-5 text-traford-orange" />}
          title="Cash on Delivery"
          subtitle="Pay when your order arrives"
          checked={paymentMethod === 'cash'}
          onClick={() => setPaymentMethod('cash')}
        />
        <Divider />
        <RadioRow
          icon={<Smartphone className="h-5 w-5 text-traford-orange" />}
          title="Mobile Money"
          subtitle="MTN or Airtel Mobile Money"
          checked={paymentMethod === 'mobile'}
          onClick={() => setPaymentMethod('mobile')}
        />
        <Divider />
        <RadioRow
          icon={<CreditCard className="h-5 w-5 text-traford-orange" />}
          title="Credit/Debit Card"
          subtitle="Visa, Mastercard accepted"
          checked={paymentMethod === 'card'}
          onClick={() => setPaymentMethod('card')}
        />
      </Section>

      {/* Mini totals — full order summary is in the right rail */}
      <div className="rounded-lg border border-traford-border bg-white p-4 text-sm">
        <Row label="Subtotal" value={`UGX ${formatUGX(subtotal)}`} />
        <Row
          label={
            deliveryMethod === 'pickup'
              ? 'Shipping (Pickup)'
              : 'Shipping (Home Delivery)'
          }
          value={shipping === 0 ? 'Free' : `UGX ${formatUGX(shipping)}`}
        />
        <div className="mt-2 border-t border-traford-border pt-2">
          <Row label="Total" value={`UGX ${formatUGX(total)}`} bold />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full text-base"
      >
        {pending
          ? 'Placing order…'
          : `Place order — UGX ${formatUGX(total)}`}
      </button>
    </form>
  );
}

// ---- Sub-components --------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-traford-dark">{title}</h2>
      <div className="rounded-lg border border-traford-border bg-white p-4 shadow-sm space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-traford-dark">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded-lg border border-traford-border bg-white px-3 py-2 text-sm outline-none focus:border-traford-orange disabled:bg-gray-100 disabled:text-gray-500"
      />
    </label>
  );
}

function RadioRow({
  icon,
  title,
  subtitle,
  trailing,
  trailingClass,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing?: string;
  trailingClass?: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-traford-orange' : 'border-gray-300'
        }`}
      >
        {checked && (
          <span className="h-2.5 w-2.5 rounded-full bg-traford-orange" />
        )}
      </span>
      {icon}
      <div className="flex-1">
        <div className="text-sm font-semibold text-traford-dark">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
      {trailing && (
        <span
          className={`text-sm font-bold ${trailingClass ?? 'text-traford-dark'}`}
        >
          {trailing}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="border-t border-traford-border" />;
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

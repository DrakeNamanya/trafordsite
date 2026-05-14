'use client';

import { useEffect, useState, useTransition } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Supplier application form — mirrors the Flutter `become_supplier_screen.dart`
 * EXACTLY so the mobile app and website share one supplier intake contract:
 *
 *   - Same fields: full_name, phone, email?, product, quantity?, frequency,
 *     notes?, plus optional district/subcounty/parish/village ids inherited
 *     from the signed-in profile.
 *   - Same frequency options: Daily / Weekly / Bi-weekly / Monthly /
 *     Seasonal / One-off (NOT the old "weekly"/"biweekly"/... lowercase set).
 *   - Same table: public.suppliers (RLS policy `suppliers_insert_any` allows
 *     anonymous inserts so guest farmers can apply without an account).
 *   - Same status default: 'pending'.
 *
 * The admin portal's new Suppliers tab reads from this same row.
 */

const FREQUENCIES = [
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'Seasonal',
  'One-off',
] as const;

interface SignedInExtras {
  district_id: number | null;
  subcounty_id: number | null;
  parish_id: number | null;
  village_id: number | null;
  district_name: string | null;
  subcounty_name: string | null;
  parish_name: string | null;
  village_name: string | null;
}

export function SupplierForm() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [frequency, setFrequency] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [extras, setExtras] = useState<SignedInExtras>({
    district_id: null,
    subcounty_id: null,
    parish_id: null,
    village_id: null,
    district_name: null,
    subcounty_name: null,
    parish_name: null,
    village_name: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  // Try to pre-fill from the signed-in profile (same behaviour as the Flutter
  // screen's initState). Silently swallows failures — the form still works
  // for guests.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'full_name, phone, email, district_id, subcounty_id, parish_id, village_id'
          )
          .eq('id', user.id)
          .maybeSingle();
        if (!profile || cancelled) return;

        if (typeof profile.full_name === 'string') setFullName(profile.full_name);
        if (typeof profile.phone === 'string') setPhone(profile.phone);
        if (typeof profile.email === 'string' && !profile.email.endsWith('@phone.trafordfresh.local')) {
          setEmail(profile.email);
        }

        // Resolve location names (best-effort; harmless if the lookups fail).
        const districtId = profile.district_id as number | null;
        const subcountyId = profile.subcounty_id as number | null;
        const parishId = profile.parish_id as number | null;
        const villageId = profile.village_id as number | null;

        const [dRes, sRes, pRes, vRes] = await Promise.all([
          districtId
            ? supabase.from('districts').select('name').eq('id', districtId).maybeSingle()
            : Promise.resolve({ data: null }),
          subcountyId
            ? supabase.from('subcounties').select('name').eq('id', subcountyId).maybeSingle()
            : Promise.resolve({ data: null }),
          parishId
            ? supabase.from('parishes').select('name').eq('id', parishId).maybeSingle()
            : Promise.resolve({ data: null }),
          villageId
            ? supabase.from('villages').select('name').eq('id', villageId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (cancelled) return;
        setExtras({
          district_id: districtId,
          subcounty_id: subcountyId,
          parish_id: parishId,
          village_id: villageId,
          district_name: (dRes.data as { name?: string } | null)?.name ?? null,
          subcounty_name: (sRes.data as { name?: string } | null)?.name ?? null,
          parish_name: (pRes.data as { name?: string } | null)?.name ?? null,
          village_name: (vRes.data as { name?: string } | null)?.name ?? null,
        });
      } catch {
        // Guest flow — ignore.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addressLine = [
    extras.village_name,
    extras.parish_name,
    extras.subcounty_name,
    extras.district_name,
  ]
    .filter((s) => s && s.length > 0)
    .join(', ');

  const validatePhone = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return 'Phone is required';
    if (!trimmed.startsWith('256')) return 'Phone must start with 256';
    if (trimmed.length < 12) return 'Enter the full 12-digit number (256XXXXXXXXX)';
    if (!/^\d+$/.test(trimmed)) return 'Phone must contain digits only';
    return null;
  };

  const validateEmail = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null; // optional
    if (!trimmed.includes('@') || !trimmed.includes('.')) return 'Enter a valid email';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!product.trim()) {
      setError('What do you want to supply?');
      return;
    }
    if (!frequency) {
      setError('Please choose how often you can supply');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        // Attach the signed-in user id if we have one (matches Flutter's
        // SupplierService.submitApplication signature).
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const insertData: Record<string, unknown> = {
          full_name: fullName.trim(),
          phone: phone.trim(),
          product: product.trim(),
          status: 'pending',
        };
        if (user?.id) insertData.user_id = user.id;
        if (email.trim()) insertData.email = email.trim();
        if (quantity.trim()) insertData.quantity = quantity.trim();
        if (frequency) insertData.frequency = frequency;
        if (notes.trim()) insertData.notes = notes.trim();
        if (extras.district_id != null) insertData.district_id = extras.district_id;
        if (extras.subcounty_id != null) insertData.subcounty_id = extras.subcounty_id;
        if (extras.parish_id != null) insertData.parish_id = extras.parish_id;
        if (extras.village_id != null) insertData.village_id = extras.village_id;

        const { error: insertError } = await supabase
          .from('suppliers')
          .insert(insertData);

        if (insertError) {
          setError(insertError.message);
          return;
        }

        setSuccess(true);
        setFullName('');
        setPhone('');
        setEmail('');
        setProduct('');
        setQuantity('');
        setFrequency('');
        setNotes('');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not submit application. Please try again.'
        );
      }
    });
  };

  if (success) {
    return (
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-traford-green" />
        <h3 className="font-display mt-3 text-lg uppercase text-traford-green">
          Application submitted!
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Our team will reach out soon to discuss your produce.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 text-xs font-semibold uppercase text-traford-green hover:underline"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Your contact (mirrors Flutter "Your contact" card) */}
      <Section title="Your contact">
        <Field
          label="Full Name *"
          value={fullName}
          onChange={setFullName}
          placeholder="Jane Doe"
        />
        <Field
          label="Phone *"
          value={phone}
          onChange={setPhone}
          placeholder="256XXXXXXXXX"
          inputMode="tel"
          maxLength={12}
        />
        <Field
          label="Email (Optional)"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
        />

        {addressLine && (
          <div className="rounded-lg border border-traford-border bg-gray-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              From your profile
            </div>
            <div className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-traford-dark">
              <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-traford-orange" />
              <span>{addressLine}</span>
            </div>
          </div>
        )}
      </Section>

      {/* SECTION 2: What you can supply (mirrors Flutter section) */}
      <Section title="What you can supply">
        <Field
          label="Product *"
          value={product}
          onChange={setProduct}
          placeholder="e.g. Tomatoes, Eggs, Maize, Milk"
        />
        <Field
          label="Quantity (Optional)"
          value={quantity}
          onChange={setQuantity}
          placeholder="e.g. 100 kg, 30 trays, 50 L"
        />
        <SelectField
          label="How often? *"
          value={frequency}
          onChange={setFrequency}
          placeholder="Choose frequency…"
          options={FREQUENCIES.map((f) => ({ value: f, label: f }))}
        />
        <Field
          label="Notes (Optional)"
          value={notes}
          onChange={setNotes}
          placeholder="Anything else we should know (variety, quality, pricing, etc.)"
          textarea
        />
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full text-base"
      >
        {pending ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-center text-[11px] text-gray-400">
        By submitting you agree to be contacted by Traford about your application.
      </p>
    </form>
  );
}

// ---- Sub-components (match the SignupForm visual contract) -----------------

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
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  maxLength?: number;
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
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-traford-border bg-white px-3 py-2 text-sm outline-none focus:border-traford-orange"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className="w-full rounded-lg border border-traford-border bg-white px-3 py-2 text-sm outline-none focus:border-traford-orange"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-traford-dark">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-traford-border bg-white px-3 py-2 text-sm outline-none focus:border-traford-orange"
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

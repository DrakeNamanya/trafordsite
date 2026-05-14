'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Supplier application form.
 *
 * Posts a row to the `suppliers` table created by the
 * 20260301000001_password_suppliers_address.sql migration.
 *
 * RLS policy `suppliers_insert_any` allows anonymous inserts so guest
 * farmers can apply without an account.
 */
export function SupplierForm() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const supabase = createClient();

        // Try to attach user_id if the visitor happens to be signed in.
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error: insertError } = await supabase
          .from('suppliers')
          .insert({
            user_id: user?.id ?? null,
            full_name: fullName,
            phone,
            email: email || null,
            product,
            quantity: quantity || null,
            frequency,
            location: location || null,
            notes: notes || null,
            status: 'pending',
          });

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
        setFrequency('weekly');
        setLocation('');
        setNotes('');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not submit application. Please try again.',
        );
      }
    });
  };

  if (success) {
    return (
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-traford-green" />
        <h3 className="font-display mt-3 text-lg uppercase text-traford-green">
          Application received
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Thanks for your interest! Our supplier team will review your
          application and reach out within 2&ndash;3 business days.
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Full name *</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Your full name"
            className="form-input"
          />
        </label>
        <label className="block">
          <span className="form-label">Phone *</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+256 700 000 000"
            className="form-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="form-label">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="form-input"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Product / produce *</span>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            required
            placeholder="e.g. Tomatoes, Honey, Tilapia"
            className="form-input"
          />
        </label>
        <label className="block">
          <span className="form-label">Quantity available</span>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 200 kg/week"
            className="form-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Supply frequency *</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            required
            className="form-input"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
            <option value="seasonal">Seasonal</option>
            <option value="one_off">One-off</option>
          </select>
        </label>
        <label className="block">
          <span className="form-label">Farm location</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="District / village"
            className="form-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="form-label">Additional notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Anything else we should know about your produce, packaging, certifications…"
          className="form-input"
        />
      </label>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-traford-red">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-green w-full"
      >
        {pending ? 'Submitting…' : 'Submit application'}
      </button>

      <p className="text-center text-[11px] text-gray-400">
        By submitting you agree to be contacted by Traford about your
        application.
      </p>
    </form>
  );
}

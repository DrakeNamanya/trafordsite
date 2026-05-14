'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Signup form for the website.
 *
 * Creates a Supabase Auth user (email + password) and writes the phone +
 * full_name into user_metadata so the `handle_new_user` trigger populates
 * the matching `profiles` row. After the migration runs, the password is
 * also hashed into profiles.password_hash via set_user_password RPC so the
 * mobile-app phone-login flow works too.
 */
export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/account';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (phone.trim().length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone.trim(),
            street_address: streetAddress || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If we have a session immediately (email confirmation disabled),
      // also write the password hash into profiles via RPC so the mobile-app
      // phone+password login flow works for this account.
      if (data.session && data.user) {
        try {
          await supabase.rpc('set_user_password', {
            p_user_id: data.user.id,
            p_password: password,
          });
        } catch {
          // Non-fatal — RPC may not exist yet if migration hasn't run.
        }

        router.push(redirect);
        router.refresh();
      } else {
        setMessage(
          'Check your email to confirm your account, then come back to sign in.',
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="form-label">Full name *</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="John Doe"
          className="form-input"
          autoComplete="name"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Phone *</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+256 700 000 000"
            className="form-input"
            autoComplete="tel"
          />
        </label>
        <label className="block">
          <span className="form-label">Email *</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="form-input"
            autoComplete="email"
          />
        </label>
      </div>

      <label className="block">
        <span className="form-label">Street / plot (optional)</span>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="Plot 12, Bukoto Street"
          className="form-input"
          autoComplete="street-address"
        />
        <span className="mt-1 block text-[11px] text-gray-400">
          You can set your full delivery location (district, subcounty, parish,
          village) later in your account.
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Password *</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Min 6 characters"
            className="form-input"
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="form-label">Confirm *</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Re-enter password"
            className="form-input"
            autoComplete="new-password"
          />
        </label>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-traford-red">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-green w-full">
        {pending ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-[11px] text-gray-400">
        By creating an account you agree to Traford&apos;s terms of service.
      </p>
    </form>
  );
}

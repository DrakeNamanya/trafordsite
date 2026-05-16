'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phone, Mail, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'phone' | 'email';
type PhoneStep = 'enter_phone' | 'enter_password' | 'not_found';

/**
 * Login form supporting two flows.
 *
 * IMPORTANT redirect strategy:
 *   * We deliberately use `window.location.href = ...` (NOT `router.push`)
 *     after a successful sign-in. Reason: the Supabase browser client
 *     writes the session into cookies, but on Cloudflare Pages the
 *     middleware runs in a *different* worker context and won't see those
 *     cookies until the next full page load. `router.push` is a client-side
 *     transition, so the middleware returns the redirect-to-login response
 *     based on its still-empty cookie state and the user appears stuck on
 *     "Welcome back" forever. A hard navigation forces the browser to
 *     send the freshly-written cookies on the next request, the middleware
 *     reads the session, and the user lands on /account.
 *
 *  1. PHONE + PASSWORD (preferred, matches mobile app)
 *     - Step A: enter phone → POST /api/auth/phone-lookup
 *       Server uses service-role to bypass RLS and returns the email
 *       associated with the phone (or has_account=false).
 *     - Step B: enter password → supabase.auth.signInWithPassword({ email, pw })
 *     - There is NO phone-only signInWithPassword call — the project's phone
 *       auth provider is intentionally disabled, every phone-first user has
 *       a real or synthetic email associated.
 *
 *  2. EMAIL + PASSWORD (fallback for users who prefer email)
 *     - Standard supabase.auth.signInWithPassword({ email, password }).
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/account';

  const [mode, setMode] = useState<Mode>('phone');

  // Phone flow
  const [phone, setPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter_phone');
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  // Email flow
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* ---------- Phone flow ---------- */

  const checkPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = phone.trim();
    if (cleaned.length < 9) {
      setError('Enter a valid phone number');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/phone-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleaned }),
        });

        const data = (await res.json()) as {
          has_account?: boolean;
          email?: string;
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? 'Could not verify phone number.');
          return;
        }

        if (!data.has_account || !data.email) {
          setPhoneStep('not_found');
          return;
        }

        setResolvedEmail(data.email);
        setPhoneStep('enter_password');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not verify phone.',
        );
      }
    });
  };

  const loginWithPhonePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resolvedEmail) {
      setError('Session expired. Please re-enter your phone.');
      setPhoneStep('enter_phone');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials')) {
          setError('Incorrect password. Please try again.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // CRITICAL: hard-navigate so the middleware sees the new cookies on
      // the next request. router.push() would skip cookie-sync on
      // Cloudflare Pages and the user would bounce back to /login.
      window.location.href = redirect;
    });
  };

  /* ---------- Email flow ---------- */

  const loginWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: emailPassword,
      });
      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials')) {
          setError('Incorrect email or password.');
        } else {
          setError(signInError.message);
        }
        return;
      }
      window.location.href = redirect;
    });
  };

  /* ---------- Render ---------- */

  const toggle = (
    <div className="mt-2 flex items-center justify-center gap-2 text-[12px]">
      <button
        type="button"
        onClick={() => {
          setMode('phone');
          setError(null);
        }}
        className={`rounded-full px-3 py-1 transition ${
          mode === 'phone'
            ? 'bg-traford-green text-white'
            : 'text-gray-500 hover:text-traford-green'
        }`}
      >
        <Phone className="-mt-0.5 mr-1 inline h-3 w-3" />
        Phone
      </button>
      <button
        type="button"
        onClick={() => {
          setMode('email');
          setError(null);
        }}
        className={`rounded-full px-3 py-1 transition ${
          mode === 'email'
            ? 'bg-traford-green text-white'
            : 'text-gray-500 hover:text-traford-green'
        }`}
      >
        <Mail className="-mt-0.5 mr-1 inline h-3 w-3" />
        Email
      </button>
    </div>
  );

  // EMAIL FLOW
  if (mode === 'email') {
    return (
      <>
        {toggle}
        <form onSubmit={loginWithEmail} className="mt-4 space-y-4">
          <label className="block">
            <span className="form-label">Email</span>
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
          <label className="block">
            <span className="form-label">Password</span>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="form-input"
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-traford-red">
              {error}
            </div>
          )}
          <button type="submit" disabled={pending} className="btn-green w-full">
            {pending ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </>
    );
  }

  // PHONE FLOW
  return (
    <>
      {toggle}

      {/* STEP A: enter phone */}
      {phoneStep === 'enter_phone' && (
        <form onSubmit={checkPhone} className="mt-4 space-y-4">
          <label className="block">
            <span className="form-label">Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="256 700 000 000"
              className="form-input"
              autoComplete="tel"
            />
            <span className="mt-1 block text-[11px] text-gray-400">
              Use the same number you registered with (e.g. 256701234567).
            </span>
          </label>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-traford-red">
              {error}
            </div>
          )}
          <button type="submit" disabled={pending} className="btn-green w-full">
            {pending ? 'Checking…' : 'Continue'}
          </button>
        </form>
      )}

      {/* STEP B: enter password */}
      {phoneStep === 'enter_password' && (
        <>
          <button
            type="button"
            onClick={() => {
              setPhoneStep('enter_phone');
              setPassword('');
              setResolvedEmail(null);
              setError(null);
            }}
            className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-traford-green"
          >
            <ArrowLeft className="h-3 w-3" /> Use a different phone
          </button>
          <form onSubmit={loginWithPhonePassword} className="mt-2 space-y-4">
            <div className="rounded border border-traford-border bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <Phone className="-mt-0.5 mr-1 inline h-3 w-3" />
              Signing in as <span className="font-semibold">{phone}</span>
            </div>
            <label className="block">
              <span className="form-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Your password"
                className="form-input"
                autoComplete="current-password"
                autoFocus
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
              {pending ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </>
      )}

      {/* STEP C: phone not found */}
      {phoneStep === 'not_found' && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold">No account found</div>
            <p className="mt-1">
              We couldn&apos;t find an account for{' '}
              <span className="font-semibold">{phone}</span>. Please register
              first.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhoneStep('enter_phone');
                setError(null);
              }}
              className="btn-secondary flex-1"
            >
              Try a different number
            </button>
            <a
              href={`/signup?redirect=${encodeURIComponent(redirect)}`}
              className="btn-green flex-1 text-center"
            >
              Register
            </a>
          </div>
        </div>
      )}
    </>
  );
}

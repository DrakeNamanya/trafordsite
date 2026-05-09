'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/account';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If email confirmation is disabled, the user is signed in immediately
      if (data.session) {
        router.push(redirect);
        router.refresh();
      } else {
        setMessage(
          'Check your email to confirm your account, then come back to sign in.'
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Full name</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-full border border-traford-border bg-white px-4 py-2.5 text-sm outline-none focus:border-traford-orange"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-full border border-traford-border bg-white px-4 py-2.5 text-sm outline-none focus:border-traford-orange"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Phone</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+256 7XX XXX XXX"
          className="w-full rounded-full border border-traford-border bg-white px-4 py-2.5 text-sm outline-none focus:border-traford-orange"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-full border border-traford-border bg-white px-4 py-2.5 text-sm outline-none focus:border-traford-orange"
        />
      </label>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}

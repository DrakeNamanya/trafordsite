'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, Mail, Lock, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'phone' | 'email';
type PhoneStatus = 'has_password' | 'no_password' | 'not_found' | null;

/**
 * Login form supporting two flows:
 *
 *  1. PHONE + PASSWORD (preferred, matches mobile app)
 *     - Step A: enter phone → call user_has_password(phone) RPC
 *     - Step B (has_password): enter password → verify_phone_password(phone, password)
 *       then establish a Supabase Auth session via signInWithPassword using the
 *       returned email.
 *     - Step B (no_password): first-time set-password flow → set_user_password(uuid, pw)
 *       then sign in.
 *
 *  2. EMAIL + PASSWORD (fallback for legacy / email-first users)
 *     - Standard supabase.auth.signInWithPassword.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/account';

  const [mode, setMode] = useState<Mode>('phone');

  // Phone flow state
  const [phone, setPhone] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email flow state
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* ---------- Phone flow ---------- */

  const checkPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc(
          'user_has_password',
          { p_phone: phone.trim() },
        );

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        const status = (data as PhoneStatus) ?? 'not_found';
        setPhoneStatus(status);

        if (status === 'not_found') {
          setError(
            'No account found for that phone number. Please register first.',
          );
          return;
        }

        // Look up the profile id + email so we can later sign in via auth.
        const { data: idData, error: idError } = await supabase.rpc(
          'profile_id_by_phone',
          { p_phone: phone.trim() },
        );
        if (!idError && idData) {
          setProfileId(idData as string);
          // Fetch email via standard query (RLS will only return public columns)
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', idData as string)
            .maybeSingle();
          if (profile?.email) setProfileEmail(profile.email);
        }

        if (status === 'no_password') {
          setInfo(
            'First time signing in. Please set a password for your account.',
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not verify phone.');
      }
    });
  };

  const loginWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const supabase = createClient();

        // 1. Verify phone+password against profiles via RPC
        const { data, error: rpcError } = await supabase.rpc(
          'verify_phone_password',
          { p_phone: phone.trim(), p_password: password },
        );

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        const rows = Array.isArray(data) ? data : [];
        if (rows.length === 0) {
          setError('Incorrect password. Please try again.');
          return;
        }

        // 2. Establish Supabase Auth session — try email/password if email known.
        if (profileEmail) {
          const { error: signInError } = await supabase.auth.signInWithPassword(
            { email: profileEmail, password },
          );
          if (signInError) {
            // Profile password verified but auth.users password may differ.
            // Fall through with a clear message.
            setError(
              'Password verified but session could not be created. Please contact support.',
            );
            return;
          }
        } else {
          // Phone-only profile, no email — sign in via phone if possible.
          const { error: signInError } = await supabase.auth.signInWithPassword(
            { phone: phone.trim(), password },
          );
          if (signInError) {
            setError(
              'Password verified but session could not be created. Please contact support.',
            );
            return;
          }
        }

        router.push(redirect);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed.');
      }
    });
  };

  const setFirstTimePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!profileId) {
      setError('Profile not loaded yet. Please re-enter your phone.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        // 1. Hash + store password on the profile row.
        const { error: setError1 } = await supabase.rpc('set_user_password', {
          p_user_id: profileId,
          p_password: newPassword,
        });
        if (setError1) {
          setError(setError1.message);
          return;
        }

        // 2. Also update the auth.users password so signInWithPassword works.
        //    This requires the user to be authenticated, so we instead rely on
        //    the customer support / admin flow to set auth password initially.
        //    For now, sign in via the phone+password flow:
        if (profileEmail) {
          const { error: signInError } =
            await supabase.auth.signInWithPassword({
              email: profileEmail,
              password: newPassword,
            });
          if (signInError) {
            setInfo(
              'Password saved. Please contact support to activate your sign-in (auth password mismatch).',
            );
            return;
          }
        } else {
          const { error: signInError } =
            await supabase.auth.signInWithPassword({
              phone: phone.trim(),
              password: newPassword,
            });
          if (signInError) {
            setInfo(
              'Password saved. Please contact support to activate your sign-in.',
            );
            return;
          }
        }

        router.push(redirect);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not set password.');
      }
    });
  };

  /* ---------- Email flow ---------- */

  const loginWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: emailPassword,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push(redirect);
      router.refresh();
    });
  };

  /* ---------- Render ---------- */

  // Toggle row
  const toggle = (
    <div className="mt-2 flex items-center justify-center gap-2 text-[12px]">
      <button
        type="button"
        onClick={() => {
          setMode('phone');
          setError(null);
          setInfo(null);
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
          setInfo(null);
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

  // PHONE FLOW — three sub-states based on phoneStatus
  return (
    <>
      {toggle}

      {/* STEP A: enter phone */}
      {phoneStatus === null && (
        <form onSubmit={checkPhone} className="mt-4 space-y-4">
          <label className="block">
            <span className="form-label">Phone number</span>
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

      {/* STEP B (has_password): enter password */}
      {phoneStatus === 'has_password' && (
        <>
          <button
            type="button"
            onClick={() => {
              setPhoneStatus(null);
              setPassword('');
            }}
            className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-traford-green"
          >
            <ArrowLeft className="h-3 w-3" /> Use a different phone
          </button>
          <form onSubmit={loginWithPassword} className="mt-2 space-y-4">
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

      {/* STEP B (no_password): first-time set password */}
      {phoneStatus === 'no_password' && (
        <>
          <button
            type="button"
            onClick={() => {
              setPhoneStatus(null);
              setNewPassword('');
              setConfirmPassword('');
              setInfo(null);
            }}
            className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-traford-green"
          >
            <ArrowLeft className="h-3 w-3" /> Use a different phone
          </button>
          <form onSubmit={setFirstTimePassword} className="mt-2 space-y-4">
            <div className="rounded border border-traford-orange/30 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              <Lock className="-mt-0.5 mr-1 inline h-3 w-3" />
              First time? Set a password for {phone}
            </div>
            <label className="block">
              <span className="form-label">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="form-input"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="form-label">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter password"
                className="form-input"
              />
            </label>
            {info && (
              <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {info}
              </div>
            )}
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
              {pending ? 'Saving…' : 'Set password & sign in'}
            </button>
          </form>
        </>
      )}
    </>
  );
}

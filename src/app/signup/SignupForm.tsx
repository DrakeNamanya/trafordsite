'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Map,
  Building2,
  Home,
  MapPin,
  Signpost,
  Lock,
  IdCard,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  loadLocationBundle,
  loadVillagesFor,
  type District,
  type Subcounty,
  type Parish,
  type Village,
} from '@/lib/location-service';

/**
 * Website signup form — mirrors the Flutter app's RegisterScreen exactly.
 *
 *   • Personal info: full name (min 2 words), DOB (>=15), phone (12-digit
 *     starting 256), optional email.
 *   • Location: cascading district → subcounty → parish → village (with
 *     lazy-load on village), plus street/plot text field.
 *   • Password + confirm.
 *   • Optional: NIN.
 *
 * Submits to the SAME `profiles` table the mobile app writes to. Before
 * trying to create the account, calls `user_has_password(phone)` so we can
 * tell the user upfront that an account already exists and route them to
 * /login — no orphan auth.users rows.
 */
export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/account';

  /* ---------- Form state (mirrors RegisterScreen) ---------- */
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('256');
  const [email, setEmail] = useState('');
  const [districtId, setDistrictId] = useState<number | ''>('');
  const [subcountyId, setSubcountyId] = useState<number | ''>('');
  const [parishId, setParishId] = useState<number | ''>('');
  const [villageId, setVillageId] = useState<number | ''>('');
  const [streetAddress, setStreetAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nin, setNin] = useState('');

  /* ---------- Location data ---------- */
  const [districts, setDistricts] = useState<District[]>([]);
  const [subcounties, setSubcounties] = useState<Subcounty[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [villagesLoading, setVillagesLoading] = useState(false);

  /* ---------- Result/error state ---------- */
  const [error, setError] = useState<string | null>(null);
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* ---------- Eager-load districts/subcounties/parishes ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadLocationBundle();
        if (cancelled) return;
        setDistricts(bundle.districts);
        setSubcounties(bundle.subcounties);
        setParishes(bundle.parishes);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Could not load locations: ${err.message}`
              : 'Could not load locations',
          );
        }
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Filter cascades in memory ---------- */
  const subcountiesForDistrict = useMemo(
    () =>
      districtId === ''
        ? []
        : subcounties.filter((s) => s.district_id === districtId),
    [subcounties, districtId],
  );
  const parishesForSubcounty = useMemo(
    () =>
      subcountyId === ''
        ? []
        : parishes.filter((p) => p.subcounty_id === subcountyId),
    [parishes, subcountyId],
  );

  /* ---------- Lazy-load villages when parish changes ---------- */
  useEffect(() => {
    if (parishId === '') {
      setVillages([]);
      return;
    }
    let cancelled = false;
    setVillagesLoading(true);
    setVillages([]);
    loadVillagesFor(parishId as number)
      .then((vs) => {
        if (!cancelled) setVillages(vs);
      })
      .catch(() => {
        if (!cancelled) setVillages([]);
      })
      .finally(() => {
        if (!cancelled) setVillagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [parishId]);

  /* ---------- Helpers ---------- */
  const calculateAge = (dobIso: string): number => {
    if (!dobIso) return 0;
    const dob = new Date(dobIso);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };

  const lookupName = (
    list: { id: number; name: string }[],
    id: number | '',
  ): string =>
    id === '' ? '' : list.find((x) => x.id === id)?.name ?? '';

  /* ---------- Validation ---------- */
  const validate = (): string | null => {
    if (!fullName.trim()) return 'Full name is required';
    if (fullName.trim().split(/\s+/).length < 2)
      return 'Enter at least first and last name';
    if (!dateOfBirth) return 'Date of birth is required';
    if (calculateAge(dateOfBirth) < 15) return 'Must be at least 15 years old';
    if (!phone.startsWith('256')) return 'Phone must start with 256';
    if (phone.length < 12) return 'Enter complete 12-digit number';
    if (email.trim() && (!email.includes('@') || !email.includes('.')))
      return 'Enter a valid email';
    if (districtId === '') return 'Select your district';
    if (subcountyId === '') return 'Select your subcounty';
    if (parishId === '') return 'Select your parish';
    if (villageId === '') return 'Select your village';
    if (!streetAddress.trim())
      return 'Enter your street / plot / building';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateMsg(null);
    setMessage(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      // 1. PROACTIVE DUPLICATE CHECK ----------------------------------
      try {
        const { data: phoneStatus } = await supabase.rpc(
          'user_has_password',
          { p_phone: phone.trim() },
        );
        if (phoneStatus && phoneStatus !== 'not_found') {
          // Existing account → bail with a friendly message + login link.
          setDuplicateMsg(
            phoneStatus === 'has_password'
              ? `An account with phone ${phone} already exists. Please sign in instead.`
              : `An account with phone ${phone} already exists but no password set. Please use "Sign in" to set one.`,
          );
          return;
        }
      } catch {
        // RPC not available — fall through; insert will surface duplicate.
      }

      // 2. CREATE auth.users + profile row -----------------------------
      const emailToUse =
        email.trim() || `${phone.trim()}@phone.trafordfresh.local`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            date_of_birth: dateOfBirth,
            district_id: districtId,
            subcounty_id: subcountyId,
            parish_id: parishId,
            village_id: villageId,
            district_name: lookupName(districts, districtId),
            subcounty_name: lookupName(subcounties, subcountyId),
            parish_name: lookupName(parishes, parishId),
            village_name: lookupName(villages, villageId),
            street_address: streetAddress.trim(),
            nin: nin.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (
          msg.includes('already') ||
          msg.includes('exists') ||
          msg.includes('duplicate') ||
          msg.includes('registered')
        ) {
          setDuplicateMsg(
            `An account with this phone or email already exists. Please sign in instead.`,
          );
        } else {
          setError(signUpError.message);
        }
        return;
      }

      const user = signUpData.user;
      if (!user) {
        setMessage(
          'Check your email to confirm your account, then come back to sign in.',
        );
        return;
      }

      // 3. UPDATE profiles row with address + DOB + NIN columns -------
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            date_of_birth: dateOfBirth,
            district_id: districtId,
            subcounty_id: subcountyId,
            parish_id: parishId,
            village_id: villageId,
            street_address: streetAddress.trim(),
            nin: nin.trim() || null,
          })
          .eq('id', user.id);
      } catch {
        // Non-fatal — profile may auto-populate via trigger
      }

      // 4. SEED profiles.password_hash via RPC so phone+password works
      try {
        await supabase.rpc('set_user_password', {
          p_user_id: user.id,
          p_password: password,
        });
      } catch {
        // Migration may not be applied yet; non-fatal.
      }

      // 5. Done — redirect on session, or show confirm-email message
      if (signUpData.session) {
        router.push(redirect);
        router.refresh();
      } else {
        setMessage(
          'Account created! Check your email to confirm, then sign in with your phone + password.',
        );
      }
    });
  };

  /* ---------- Render ---------- */
  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* DUPLICATE BANNER — most important UX touch the user asked for */}
      {duplicateMsg && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Account already exists</div>
          <p className="mt-1">{duplicateMsg}</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="mt-2 inline-block rounded bg-amber-600 px-4 py-1.5 text-xs font-semibold uppercase text-white transition hover:bg-amber-700"
          >
            Go to sign in
          </Link>
        </div>
      )}

      {/* ---------- PERSONAL INFO ---------- */}
      <Section title="Personal Information">
        <Field
          icon={<User className="h-4 w-4" />}
          label="Full Name *"
          value={fullName}
          onChange={setFullName}
          placeholder="John Doe"
          autoComplete="name"
        />
        <Field
          icon={<Calendar className="h-4 w-4" />}
          label="Date of Birth *"
          type="date"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          hint="You must be at least 15 years old"
        />
        <Field
          icon={<Phone className="h-4 w-4" />}
          label="Phone Number *"
          type="tel"
          value={phone}
          onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 12))}
          placeholder="256XXXXXXXXX"
          hint="Uganda number starting with 256"
          autoComplete="tel"
        />
        <Field
          icon={<Mail className="h-4 w-4" />}
          label="Email (Optional)"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="your@email.com"
          hint="Optional — you can add this later"
          autoComplete="email"
        />
      </Section>

      {/* ---------- LOCATION ---------- */}
      <Section
        title="Location"
        subtitle={
          locationLoading
            ? 'Loading locations…'
            : 'Select your district, then subcounty, parish, and village'
        }
      >
        {locationLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-traford-orange" />
            Loading locations from server…
          </div>
        ) : (
          <>
            <SelectField
              icon={<Map className="h-4 w-4" />}
              label="District *"
              value={districtId}
              onChange={(v) => {
                setDistrictId(v);
                setSubcountyId('');
                setParishId('');
                setVillageId('');
              }}
              options={districts.map((d) => ({ id: d.id, name: d.name }))}
              placeholder="Select district"
            />
            <SelectField
              icon={<Building2 className="h-4 w-4" />}
              label="Subcounty *"
              value={subcountyId}
              onChange={(v) => {
                setSubcountyId(v);
                setParishId('');
                setVillageId('');
              }}
              options={subcountiesForDistrict.map((s) => ({
                id: s.id,
                name: s.name,
              }))}
              placeholder={
                districtId === ''
                  ? 'Select district first'
                  : subcountiesForDistrict.length === 0
                    ? 'No subcounties available'
                    : 'Select subcounty'
              }
              disabled={districtId === ''}
            />
            <SelectField
              icon={<Home className="h-4 w-4" />}
              label="Parish *"
              value={parishId}
              onChange={(v) => {
                setParishId(v);
                setVillageId('');
              }}
              options={parishesForSubcounty.map((p) => ({
                id: p.id,
                name: p.name,
              }))}
              placeholder={
                subcountyId === ''
                  ? 'Select subcounty first'
                  : parishesForSubcounty.length === 0
                    ? 'No parishes available'
                    : 'Select parish'
              }
              disabled={subcountyId === ''}
            />
            <SelectField
              icon={<MapPin className="h-4 w-4" />}
              label="Village *"
              value={villageId}
              onChange={setVillageId}
              options={villages.map((v) => ({ id: v.id, name: v.name }))}
              placeholder={
                parishId === ''
                  ? 'Select parish first'
                  : villagesLoading
                    ? 'Loading villages…'
                    : villages.length === 0
                      ? 'No villages available'
                      : 'Select village'
              }
              disabled={parishId === '' || villagesLoading}
              busy={villagesLoading}
            />
            <Field
              icon={<Signpost className="h-4 w-4" />}
              label="Street / Plot No. / Building / Road *"
              value={streetAddress}
              onChange={setStreetAddress}
              placeholder="e.g. Plot 12, Mukasa Bldg, Bombo Rd"
              hint="So the rider can find your exact gate"
              autoComplete="street-address"
            />
          </>
        )}
      </Section>

      {/* ---------- PASSWORD ---------- */}
      <Section
        title="Password"
        subtitle="Use this password to sign in next time with your phone number."
      >
        <Field
          icon={<Lock className="h-4 w-4" />}
          label="Password *"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          label="Confirm Password *"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
      </Section>

      {/* ---------- OPTIONAL ---------- */}
      <Section title="Optional Information">
        <Field
          icon={<IdCard className="h-4 w-4" />}
          label="NIN Number (Optional)"
          value={nin}
          onChange={(v) => setNin(v.toUpperCase())}
          placeholder="National ID Number"
          hint="This is optional for now"
        />
      </Section>

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

      <button
        type="submit"
        disabled={pending || locationLoading}
        className="btn-green w-full"
      >
        {pending ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-[11px] text-gray-400">
        By creating an account you agree to Traford&apos;s terms of service.
      </p>
    </form>
  );
}

/* ---------- Sub-components (kept in this file to mirror the Dart layout) ---------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-base font-bold text-traford-dark">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      )}
      <div className="mt-3 space-y-3 rounded-lg border border-traford-border bg-white p-4">
        {children}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
  autoComplete,
}: {
  icon?: React.ReactNode;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`form-input ${icon ? 'pl-9' : ''}`}
        />
      </span>
      {hint && (
        <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>
      )}
    </label>
  );
}

function SelectField({
  icon,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  busy,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
  options: { id: number; name: string }[];
  placeholder: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <select
          value={value === '' ? '' : String(value)}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? '' : Number(v));
          }}
          disabled={disabled}
          className={`form-input appearance-none ${icon ? 'pl-9' : ''} disabled:cursor-not-allowed disabled:bg-gray-50`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {busy && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-traford-orange" />
          </span>
        )}
      </span>
    </label>
  );
}

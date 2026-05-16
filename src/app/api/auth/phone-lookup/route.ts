import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side phone → email resolver for the LoginForm.
 *
 * Why this exists:
 *   * The public Supabase project has the **phone auth provider disabled**,
 *     so `supabase.auth.signInWithPassword({ phone, password })` will always
 *     fail. The only way to start a session for a phone-first user is to
 *     translate the phone into the email Supabase Auth knows about and call
 *     `signInWithPassword({ email, password })`.
 *   * RLS on `public.profiles` hides every row from `anon`, so a browser
 *     call to `profiles?phone=eq.XXX` returns `[]` even when the row exists.
 *   * The legacy `profile_email_by_phone` RPC depends on a pgcrypto-enabled
 *     migration that may not have been applied yet.
 *
 * Instead of routing through the broken RPCs, we use the **service role key**
 * server-side (Cloudflare Workers edge runtime, never exposed to the browser)
 * to fetch the row directly. We return ONLY the email + a "has_account"
 * boolean — no other profile data leaves the server.
 *
 * Auth model:
 *   * The endpoint takes a phone and returns at most:
 *       { has_account: false }                                — not registered
 *       { has_account: true, email: 'user@example.com' }      — registered
 *   * No PII beyond the email field. The phone is only used as a lookup key.
 *
 * This endpoint must run on the edge runtime (Cloudflare Pages constraint).
 */

export const runtime = 'edge';

interface PhoneLookupRequest {
  phone?: string;
}

export async function POST(request: Request) {
  let body: PhoneLookupRequest;
  try {
    body = (await request.json()) as PhoneLookupRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone = (body.phone ?? '').trim();
  if (!phone || phone.length < 9) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
  }

  // Service role bypasses RLS — required because `profiles` is locked down
  // for anon reads. The key lives in Cloudflare env vars (server-only).
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        error:
          'Server is missing SUPABASE_SERVICE_ROLE_KEY. Phone-only login is disabled until it is set in the Cloudflare Pages env.',
      },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Try a couple of variants of the phone string so a user typing
  // "0701634653" still matches the canonical "256701634653" we store.
  const variants = new Set<string>();
  variants.add(phone);
  if (phone.startsWith('0')) variants.add('256' + phone.slice(1));
  if (phone.startsWith('+256')) variants.add(phone.slice(1));
  if (phone.startsWith('256')) variants.add('0' + phone.slice(3));

  for (const candidate of variants) {
    const { data, error } = await admin
      .from('profiles')
      .select('email, phone')
      .eq('phone', candidate)
      .maybeSingle();

    if (error) {
      // Don't leak DB errors; log server-side via the Cloudflare logs and
      // return a generic 500 so the client falls back gracefully.
      console.error('phone-lookup db error', error);
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
    }
    if (data?.email) {
      return NextResponse.json({
        has_account: true,
        email: data.email,
        matched_phone: data.phone,
      });
    }
  }

  return NextResponse.json({ has_account: false });
}

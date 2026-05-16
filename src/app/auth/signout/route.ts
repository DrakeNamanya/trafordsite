import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Sign-out endpoint.
 *
 * Supports both GET (so plain <a href="/auth/signout"> links work — which is
 * what was hitting the previous POST-only route and surfacing as an
 * "Internal Server Error" on Cloudflare Pages) and POST (used by form-based
 * sign-out buttons elsewhere in the app).
 *
 * Both methods:
 *   1. Call supabase.auth.signOut() which clears the server-side Supabase
 *      auth cookies via the cookie helpers in `src/lib/supabase/server.ts`.
 *   2. Redirect with `303 See Other` so the browser follows with GET.
 *
 * The redirect target is the request origin (e.g. trafordsite2.pages.dev)
 * rather than process.env.NEXT_PUBLIC_SITE_URL — that env var is not
 * available on edge runtime at runtime and was forcing a hard-coded
 * localhost URL into production.
 */
async function doSignOut(request: NextRequest) {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Even if Supabase complains (e.g. token already revoked), still
    // redirect home — the user clearly wants out.
  }
  const url = new URL('/', request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: NextRequest) {
  return doSignOut(request);
}

export async function POST(request: NextRequest) {
  return doSignOut(request);
}

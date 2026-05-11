'use client';

/**
 * Legacy Supabase realtime subscription — no longer used in the guest cart flow.
 * Kept as an inert no-op so any stale imports won't break the build.
 * Safe to delete in a future cleanup pass.
 */
export function CartRealtime(_props: { userId?: string }) {
  return null;
}

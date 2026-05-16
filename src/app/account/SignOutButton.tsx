'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Sign-out button. Clears the browser Supabase session first (so the
 * SDK can't quietly re-issue a refresh token from memory), THEN
 * hard-navigates to /auth/signout — a server route that wipes the SSR
 * cookies via @supabase/ssr before redirecting home. Hard navigation is
 * essential on Cloudflare Pages, otherwise the middleware never sees
 * the cleared session.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  const signOut = () => {
    startTransition(async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Even if local sign-out fails, still hit the server route — it
        // will clear the SSR cookies and bounce home.
      }
      window.location.href = '/auth/signout';
    });
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="flex items-center gap-2 rounded-full border border-traford-border bg-white px-3 py-2 text-xs font-semibold text-traford-dark hover:bg-traford-mint disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

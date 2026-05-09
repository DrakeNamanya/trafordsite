import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-traford-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-traford-orange text-white font-bold">
            T
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-traford-dark">Traford</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-traford-green">
              Farm Fresh
            </div>
          </div>
        </Link>

        {/* Search (desktop) */}
        <form action="/shop" className="hidden flex-1 max-w-xl md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-traford-muted" />
            <input
              type="search"
              name="q"
              placeholder="Search fresh produce, honey, meat…"
              className="w-full rounded-full border border-traford-border bg-traford-bg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-traford-orange"
            />
          </div>
        </form>

        {/* Nav */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/shop"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-traford-dark hover:bg-traford-mint sm:inline-block"
          >
            Shop
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full p-2 text-traford-dark hover:bg-traford-mint"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {user ? (
            <Link href="/account" className="btn-outline !py-2 !px-3 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          ) : (
            <Link href="/login" className="btn-primary !py-2 !px-4 text-xs sm:text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

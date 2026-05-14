import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/supabase/types';
import { AnnouncementBar } from './AnnouncementBar';
import { ContactBar } from './ContactBar';
import { CartCountBadge } from './CartCountBadge';
import { MobileNav } from './MobileNav';

/**
 * Three-tier site header:
 *   1. Red announcement bar (closeable, MoMo numbers)
 *   2. Green contact bar (phone, email, login/register/account)
 *   3. White sticky main nav (logo + dynamic categories from Supabase + search/cart icons)
 *
 * Categories come live from the `categories` table so the menu always reflects
 * what's actually available in the catalogue.
 */
export async function Header() {
  // Wrap EVERYTHING in try/catch — Header runs on every request, so any
  // Supabase hiccup (RLS change, schema drift, network blip) here would
  // 500 the entire site. Better to render an empty nav than a broken site.
  let user: { id: string } | null = null;
  let categories: Pick<Category, 'id' | 'name' | 'slug'>[] = [];
  let userName: string | null | undefined = undefined;

  try {
    const supabase = await createClient();

    const userResult = await supabase.auth.getUser();
    user = userResult.data.user;

    const catResult = await supabase
      .from('categories')
      .select('id, name, slug, sort_order, parent_id, is_active')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('sort_order', { ascending: true });

    categories = (catResult.data ?? []) as Pick<
      Category,
      'id' | 'name' | 'slug'
    >[];

    if (user) {
      const profileResult = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      userName = (profileResult.data as { full_name?: string | null } | null)
        ?.full_name;
    }
  } catch {
    // Swallow — render the shell with no categories rather than 500-ing.
  }

  return (
    <>
      <AnnouncementBar />
      <ContactBar isAuthed={Boolean(user)} userName={userName} />

      {/* Main navigation — sticky white bar */}
      <nav className="sticky top-0 z-40 border-b-2 border-traford-border bg-white shadow-sm">
        <div className="mx-auto flex h-[70px] max-w-[1280px] items-center px-4">
          {/* Logo */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="Traford Farm Fresh"
              width={246}
              height={138}
              className="h-[55px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Category nav (desktop) */}
          <div className="ml-6 hidden flex-1 items-center justify-center gap-0 md:flex">
            {categories.slice(0, 9).map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="font-display whitespace-nowrap border-b-[3px] border-transparent px-2 py-6 text-[13px] font-medium text-traford-text transition hover:border-traford-green hover:text-traford-green"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/contact"
              className="font-display whitespace-nowrap border-b-[3px] border-transparent px-2 py-6 text-[13px] font-medium text-traford-text transition hover:border-traford-green hover:text-traford-green"
            >
              Contact
            </Link>
            <Link
              href="/supplier"
              className="font-display whitespace-nowrap border-b-[3px] border-transparent px-2 py-6 text-[13px] font-semibold text-traford-green transition hover:border-traford-green"
            >
              Supplier
            </Link>
          </div>

          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-4">
            {/* Search (desktop): direct GET to /shop */}
            <form action="/shop" className="hidden lg:block">
              <label className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search..."
                  className="w-[200px] rounded border border-traford-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-traford-green"
                />
              </label>
            </form>

            {/* Cart icon w/ live badge */}
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-gray-600 transition hover:text-traford-green"
            >
              <ShoppingCart className="h-5 w-5" />
              <CartCountBadge variant="badge" />
            </Link>

            {/* Mobile menu toggle (handles its own state) */}
            <MobileNav categories={categories} isAuthed={Boolean(user)} />
          </div>
        </div>
      </nav>
    </>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Tractor } from 'lucide-react';
import { CategoryTabs } from '@/components/CategoryTabs';
import { fetchCategories, fetchProducts } from '@/lib/api';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const revalidate = 60; // ISR: refresh home every minute

export default async function HomePage() {
  // Pull the FULL catalogue so visitors land on the page and can immediately
  // start shopping every product we sell (capped at 200 for sanity).
  const [allProducts, allCategories] = await Promise.all([
    fetchProducts({ limit: 200 }).catch(() => []),
    fetchCategories().catch(() => []),
  ]);

  // Top-level categories only — cap at 9 for the tab strip.
  const topCategories = allCategories
    .filter((c) => c.parent_id === null || c.parent_id === undefined)
    .slice(0, 9);

  return (
    <>
      {/* HERO — compact, gets out of the way fast so users can shop */}
      <section className="relative min-h-[300px] overflow-hidden bg-traford-green">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&h=800&fit=crop"
            alt="Fresh produce abundance"
            fill
            priority
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #3aaa35 40%, transparent 40%)',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[300px] max-w-[1200px] items-center px-4 py-10">
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              Direct from Ugandan farms
            </span>
            <h1 className="font-display mt-3 text-4xl font-bold uppercase leading-[1.05] text-white drop-shadow-md sm:text-5xl md:text-[56px]">
              Farm - Fresh
              <br />
              Abundance
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base">
              Premium fresh fruits, vegetables, spices, herbs and seafood
              sourced directly from Uganda&apos;s finest farms.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="font-display inline-flex items-center gap-2 rounded bg-traford-orange px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-traford-orange-dark sm:text-base"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop Now
              </Link>
              <Link
                href="/supplier"
                className="font-display inline-flex items-center gap-2 rounded border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/20 sm:text-base"
              >
                <Tractor className="h-4 w-4" />
                Become a supplier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS + FULL PRODUCT GRID
          This is the only thing below the hero — every product, filterable
          by category. Customers land here and start shopping immediately. */}
      <CategoryTabs categories={topCategories} products={allProducts} />
    </>
  );
}

import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
import type { Product, Category } from '@/lib/supabase/types';

export const revalidate = 30;

interface ShopPageProps {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Load top-level categories for filter chips
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true });

  const topCategories = (categories ?? []) as Category[];

  // Resolve category slug -> id
  let categoryId: string | null = null;
  if (params.category) {
    const match = topCategories.find((c) => c.slug === params.category);
    if (match) categoryId = match.id;
  }

  // Build product query — RLS automatically hides field_staff_only items for public users
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('audience', 'public');

  if (categoryId) query = query.eq('category_id', categoryId);
  if (params.q) query = query.ilike('name', `%${params.q}%`);

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: products, count } = await query.limit(60);
  const productList = (products ?? []) as Product[];

  return (
    <div>
      {/* Orange header */}
      <section className="bg-traford-orange px-4 pb-6 pt-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Shop</h1>
          <button
            type="button"
            aria-label="Filters"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Embedded white search */}
        <form action="/shop" className="mx-auto mt-4 max-w-7xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-traford-muted" />
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Search products…"
              className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-traford-dark outline-none focus:ring-2 focus:ring-white/50"
            />
            {params.category && (
              <input type="hidden" name="category" value={params.category} />
            )}
          </div>
        </form>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Category chips */}
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/shop"
            className={`chip ${!params.category ? 'chip-active' : ''}`}
          >
            All
          </Link>
          {topCategories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={`chip whitespace-nowrap ${
                params.category === c.slug ? 'chip-active' : ''
              }`}
            >
              <span className="mr-1">{c.emoji ?? '🛒'}</span>
              {c.name}
            </Link>
          ))}
        </div>

        {/* Count + sort */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="font-semibold text-traford-dark">
            {count ?? productList.length} products
          </div>
          <SortMenu current={params.sort} />
        </div>

        {/* Product grid */}
        {productList.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-traford-border p-10 text-center text-traford-muted">
            No products found. Try a different search.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {productList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SortMenu({ current }: { current?: string }) {
  const options = [
    { v: 'newest', label: 'Newest' },
    { v: 'price_asc', label: 'Price: Low to High' },
    { v: 'price_desc', label: 'Price: High to Low' },
    { v: 'rating', label: 'Top rated' },
  ];
  return (
    <form action="/shop" method="GET" className="flex items-center gap-2">
      <label className="text-traford-muted">Sort by:</label>
      <select
        name="sort"
        defaultValue={current ?? 'newest'}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-full border border-traford-border bg-white px-3 py-1.5 text-xs font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}

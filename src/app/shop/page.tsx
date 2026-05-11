import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { fetchCategories, fetchProducts } from '@/lib/api';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const revalidate = 30;

interface ShopPageProps {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const [allCategories, allProducts] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchProducts({ limit: 200, search: params.q }).catch(() => []),
  ]);

  const topCategories = allCategories.filter(
    (c) => c.parent_id === null || c.parent_id === undefined
  );

  // Resolve category slug -> id for filtering
  let categoryId: string | number | null = null;
  if (params.category) {
    const match = topCategories.find((c) => c.slug === params.category);
    if (match) categoryId = match.id;
  }

  // Filter + sort in memory (the public API doesn't expose all sort params)
  let products = allProducts;
  if (categoryId !== null) {
    products = products.filter(
      (p) => String(p.category_id) === String(categoryId)
    );
  }

  switch (params.sort) {
    case 'price_asc':
      products = products.slice().sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products = products.slice().sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products = products.slice().sort((a, b) => b.rating - a.rating);
      break;
    default:
      // 'newest' — public API already returns in recommended order
      break;
  }

  const count = products.length;

  return (
    <div>
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
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/shop"
            className={`chip ${!params.category ? 'chip-active' : ''}`}
          >
            All
          </Link>
          {topCategories.map((c) => (
            <Link
              key={String(c.id)}
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

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="font-semibold text-traford-dark">
            {count} products
          </div>
          <SortMenu current={params.sort} />
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-traford-border p-10 text-center text-traford-muted">
            No products found. Try a different search.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={String(p.id)} product={p} />
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

import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { SortMenu } from './SortMenu';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const revalidate = 30;

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    min?: string;
    max?: string;
    rating?: string;
  }>;
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

  // Parse price/rating filters
  const minPrice = params.min ? Number(params.min) : null;
  const maxPrice = params.max ? Number(params.max) : null;
  const minRating = params.rating ? Number(params.rating) : null;

  // Filter + sort in memory (the public API doesn't expose all sort params)
  let products = allProducts;
  if (categoryId !== null) {
    products = products.filter(
      (p) => String(p.category_id) === String(categoryId)
    );
  }
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    products = products.filter((p) => p.price >= minPrice);
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    products = products.filter((p) => p.price <= maxPrice);
  }
  if (minRating !== null && !Number.isNaN(minRating)) {
    products = products.filter((p) => (p.rating || 0) >= minRating);
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
      break;
  }

  const count = products.length;

  // Helper to build hrefs preserving other filters
  const buildHref = (
    overrides: Partial<Record<string, string | null>>
  ): string => {
    const search = new URLSearchParams();
    const merged: Record<string, string | null | undefined> = {
      category: params.category,
      q: params.q,
      sort: params.sort,
      min: params.min,
      max: params.max,
      rating: params.rating,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        search.set(k, String(v));
      }
    });
    const qs = search.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  return (
    <div>
      <section className="bg-traford-orange px-4 pb-6 pt-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="font-display text-2xl uppercase sm:text-3xl">Shop</h1>
          <span className="hidden text-sm text-white/85 sm:block">
            {count} {count === 1 ? 'product' : 'products'}
          </span>
        </div>

        <form action="/shop" className="mx-auto mt-4 max-w-7xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Search products…"
              className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-traford-text outline-none focus:ring-2 focus:ring-white/50"
            />
            {params.category && (
              <input type="hidden" name="category" value={params.category} />
            )}
            {params.sort && (
              <input type="hidden" name="sort" value={params.sort} />
            )}
          </div>
        </form>
      </section>

      {/* Mobile category chip strip */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:hidden lg:px-8">
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={buildHref({ category: null })}
            className={`chip ${!params.category ? 'chip-active' : ''}`}
          >
            All
          </Link>
          {topCategories.map((c) => (
            <Link
              key={String(c.id)}
              href={buildHref({ category: c.slug })}
              className={`chip ${
                params.category === c.slug ? 'chip-active' : ''
              }`}
            >
              <span>{c.emoji ?? '🛒'}</span>
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* STICKY SIDEBAR (desktop only) */}
        <aside className="shop-sidebar">
          {/* Categories */}
          <div>
            <h4>Categories</h4>
            <ul className="space-y-1 text-[13px]">
              <li>
                <Link
                  href={buildHref({ category: null })}
                  className={`block rounded px-2 py-1.5 transition ${
                    !params.category
                      ? 'bg-traford-green/10 font-semibold text-traford-green'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All products
                </Link>
              </li>
              {topCategories.map((c) => (
                <li key={String(c.id)}>
                  <Link
                    href={buildHref({ category: c.slug })}
                    className={`flex items-center gap-1.5 rounded px-2 py-1.5 transition ${
                      params.category === c.slug
                        ? 'bg-traford-green/10 font-semibold text-traford-green'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{c.emoji ?? '🛒'}</span>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price range */}
          <div className="mt-5 border-t border-traford-border pt-4">
            <h4>Price (UGX)</h4>
            <form action="/shop" method="GET" className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  name="min"
                  defaultValue={params.min ?? ''}
                  placeholder="Min"
                  className="w-full rounded border border-traford-border px-2 py-1 text-[12px] outline-none focus:border-traford-green"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  name="max"
                  defaultValue={params.max ?? ''}
                  placeholder="Max"
                  className="w-full rounded border border-traford-border px-2 py-1 text-[12px] outline-none focus:border-traford-green"
                />
              </div>
              {/* Preserve other filters in hidden fields */}
              {params.category && (
                <input type="hidden" name="category" value={params.category} />
              )}
              {params.q && <input type="hidden" name="q" value={params.q} />}
              {params.sort && (
                <input type="hidden" name="sort" value={params.sort} />
              )}
              {params.rating && (
                <input type="hidden" name="rating" value={params.rating} />
              )}
              <button
                type="submit"
                className="w-full rounded bg-traford-green py-1.5 text-[11px] font-semibold uppercase text-white transition hover:bg-traford-green-dark"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Rating */}
          <div className="mt-5 border-t border-traford-border pt-4">
            <h4>Minimum rating</h4>
            <ul className="space-y-1 text-[13px]">
              {[null, 4, 3, 2].map((r) => (
                <li key={`r-${r ?? 'any'}`}>
                  <Link
                    href={buildHref({ rating: r === null ? null : String(r) })}
                    className={`flex items-center gap-1 rounded px-2 py-1 transition ${
                      String(params.rating ?? '') === String(r ?? '')
                        ? 'bg-amber-50 font-semibold text-amber-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r === null ? (
                      'Any rating'
                    ) : (
                      <>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {r}+ stars
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Reset */}
          {(params.category ||
            params.q ||
            params.min ||
            params.max ||
            params.rating ||
            params.sort) && (
            <div className="mt-5 border-t border-traford-border pt-4">
              <Link
                href="/shop"
                className="block rounded border border-traford-border bg-white py-1.5 text-center text-[11px] font-semibold uppercase text-gray-600 transition hover:border-traford-red hover:text-traford-red"
              >
                Reset filters
              </Link>
            </div>
          )}
        </aside>

        {/* RESULTS */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm">
            <div className="font-semibold text-traford-dark">
              {count} {count === 1 ? 'product' : 'products'}
            </div>
            <SortMenu />
          </div>

          {products.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-traford-border p-10 text-center text-gray-500">
              No products found. Try a different search or
              {' '}
              <Link href="/shop" className="font-semibold text-traford-green hover:underline">
                reset filters
              </Link>
              .
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={String(p.id)} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

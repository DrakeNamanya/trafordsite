'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Sort dropdown — client component so the <select onChange> handler
 * can ship to the browser. Updates the ?sort=... query param while
 * preserving every other current filter.
 */
export function SortMenu() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get('sort') ?? 'newest';

  const options = [
    { v: 'newest', label: 'Newest' },
    { v: 'price_asc', label: 'Price: Low to High' },
    { v: 'price_desc', label: 'Price: High to Low' },
    { v: 'rating', label: 'Top rated' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(sp.toString());
    const v = e.target.value;
    if (v && v !== 'newest') {
      next.set('sort', v);
    } else {
      next.delete('sort');
    }
    const qs = next.toString();
    router.push(qs ? `/shop?${qs}` : '/shop');
  };

  return (
    <div className="flex items-center gap-2">
      <label className="hidden text-gray-500 sm:block">Sort by:</label>
      <select
        name="sort"
        value={current}
        onChange={handleChange}
        className="rounded-full border border-traford-border bg-white px-3 py-1.5 text-xs font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

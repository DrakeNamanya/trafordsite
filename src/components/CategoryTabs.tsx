'use client';

import { useState } from 'react';
import {
  Apple,
  Carrot,
  Leaf,
  Wheat,
  Fish,
  Beef,
  Drumstick,
  Tag,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import type { ApiCategory, ApiProduct } from '@/lib/api';
import { ProductCard } from './ProductCard';

/**
 * Category tab strip + filtered product grid.
 * Filters in-memory against ApiProduct.category_id when a tab is clicked.
 */
export function CategoryTabs({
  categories,
  products,
}: {
  categories: ApiCategory[];
  products: ApiProduct[];
}) {
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const visible = activeId
    ? products.filter(
        (p) => String(p.category_id) === String(activeId)
      )
    : products;

  const iconFor = (name: string): LucideIcon => {
    const k = name.toLowerCase();
    if (k.includes('fruit')) return Apple;
    if (k.includes('vegetable')) return Carrot;
    if (k.includes('herb')) return Leaf;
    if (k.includes('honey') || k.includes('bee')) return Leaf;
    if (k.includes('dry') || k.includes('grain') || k.includes('legume')) return Wheat;
    if (k.includes('fish') || k.includes('sea')) return Fish;
    if (k.includes('beef')) return Beef;
    if (
      k.includes('chicken') ||
      k.includes('poultry') ||
      k.includes('goat') ||
      k.includes('meat')
    )
      return Drumstick;
    if (k.includes('fresh')) return Leaf;
    return Tag;
  };

  return (
    <>
      <section className="bg-traford-bg-alt py-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center px-4">
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className={`font-display flex items-center gap-2 border-r border-traford-border px-7 py-3 text-[15px] font-medium uppercase tracking-wider transition first:rounded-l ${
              activeId === null
                ? 'bg-traford-green text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All
          </button>
          {categories.map((cat, i) => {
            const Icon = iconFor(cat.name);
            const isLast = i === categories.length - 1;
            const isActive = String(activeId) === String(cat.id);
            return (
              <button
                key={String(cat.id)}
                type="button"
                onClick={() => setActiveId(cat.id)}
                className={`font-display flex items-center gap-2 px-7 py-3 text-[15px] font-medium uppercase tracking-wider transition ${
                  !isLast ? 'border-r border-traford-border' : 'rounded-r'
                } ${
                  isActive
                    ? 'bg-traford-green text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10">
        {visible.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-base">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {visible.map((p) => (
              <ProductCard key={String(p.id)} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import type { ApiProduct } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { formatUGX } from '@/lib/format';
import { useState } from 'react';

/**
 * Product card backed by the new /api/public/* schema (ApiProduct).
 *
 * The card itself is a <Link> to the product detail page. The Add-to-cart
 * button is rendered as a sibling overlay (NOT nested in the anchor) — that
 * way it can be a real <button> without breaking HTML validity, and the
 * stopPropagation prevents the link click from firing.
 */
export function ProductCard({ product }: { product: ApiProduct }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded border border-traford-border bg-white p-4 text-center transition hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-1 flex-col"
      >
        {/* Image area */}
        <div className="relative flex h-[200px] w-full items-center justify-center p-2">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              🥗
            </div>
          )}

          {product.has_discount && product.discount_percent ? (
            <span className="absolute left-2 top-2 rounded-full bg-traford-red px-2 py-0.5 text-[10px] font-bold text-white">
              -{product.discount_percent}%
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 line-clamp-2 text-sm font-normal leading-snug text-gray-700">
          {product.name}
        </h3>

        <div className="mt-1.5 font-display text-base font-semibold text-traford-red">
          {formatUGX(product.price)}
          {product.unit ? (
            <span className="ml-1 text-[11px] font-normal text-gray-500">
              / {product.unit}
            </span>
          ) : null}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="font-display mx-auto mt-2 inline-flex items-center gap-1.5 rounded bg-traford-green px-5 py-1.5 text-xs font-semibold text-white transition hover:bg-traford-green/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        {product.stock <= 0
          ? 'Sold out'
          : justAdded
            ? 'Added ✓'
            : 'Add to cart'}
      </button>
    </div>
  );
}

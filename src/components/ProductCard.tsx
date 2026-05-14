'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import type { ApiProduct } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { formatUGX } from '@/lib/format';
import { useState } from 'react';

/**
 * Joom-style product card.
 *
 * Design notes:
 *   • Square image area (aspect-square) — denser, more catalogue-like.
 *   • Discount pill top-left, quick-add cart fab bottom-right of image.
 *   • Two-line title, price + struck-through original, rating row, sold count.
 *   • Whole card is a <Link> to /product/[slug]; the fab uses
 *     stopPropagation so it can be a real <button>.
 */
export function ProductCard({ product }: { product: ApiProduct }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  const hasDiscount =
    product.has_discount &&
    (product.discount_percent ?? 0) > 0 &&
    (product.compare_at_price ?? product.original_price ?? 0) > product.price;

  const originalPrice =
    product.compare_at_price ?? product.original_price ?? null;

  // Stable pseudo-random "sold" number so cards look populated without DB.
  const soldCount = Math.max(
    12,
    Math.round(((product.rating || 4.2) * 37 + (product.review_count || 4) * 11) % 999) + 12,
  );

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-traford-border bg-white transition hover:-translate-y-0.5 hover:border-traford-green/40 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]"
    >
      {/* IMAGE — square, contained */}
      <div className="relative aspect-square w-full overflow-hidden bg-traford-bg">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🥗
          </div>
        )}

        {hasDiscount && product.discount_percent ? (
          <span className="absolute left-2 top-2 rounded-md bg-traford-red px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{product.discount_percent}%
          </span>
        ) : null}

        {product.stock <= 0 ? (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
            Sold out
          </span>
        ) : null}

        {/* Quick-add FAB */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={product.stock <= 0}
          aria-label="Add to cart"
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-traford-green text-white shadow-md transition hover:bg-traford-green-dark disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>

        {justAdded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase text-white">
            Added ✓
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex flex-1 flex-col px-2.5 py-2 sm:px-3 sm:py-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[15px] font-semibold text-traford-red sm:text-base">
            {formatUGX(product.price)}
          </span>
          {hasDiscount && originalPrice ? (
            <span className="text-[11px] text-gray-400 line-through">
              {formatUGX(originalPrice)}
            </span>
          ) : null}
        </div>

        <h3 className="mt-1 line-clamp-2 min-h-[2.4em] text-[12.5px] leading-snug text-gray-700 sm:text-[13px]">
          {product.name}
        </h3>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-700">
              {(product.rating || 0).toFixed(1)}
            </span>
            <span className="ml-0.5 text-gray-400">
              ({product.review_count || 0})
            </span>
          </span>
          <span className="text-gray-400">{soldCount} sold</span>
        </div>

        {product.unit ? (
          <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-gray-400">
            per {product.unit}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

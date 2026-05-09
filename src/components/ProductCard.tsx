import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '@/lib/supabase/types';
import { formatUGX } from '@/lib/format';

/**
 * Product card matching the reference design:
 *   - White card with thin border, hover lift + shadow
 *   - Image area with hover overlay containing cart + wishlist circle buttons
 *   - Name (gray, regular weight), red price in Oswald, optional unit
 *   - "Add to Cart" pill that fades in on hover
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded border border-traford-border bg-white p-4 text-center transition hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
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
          <div className="flex h-full w-full items-center justify-center text-5xl">🥗</div>
        )}

        {/* Discount badge */}
        {product.has_discount && product.discount_percent ? (
          <span className="absolute left-2 top-2 rounded-full bg-traford-red px-2 py-0.5 text-[10px] font-bold text-white">
            -{product.discount_percent}%
          </span>
        ) : null}

        {/* Hover overlay with circle buttons (clicks bubble up to product link by default,
            but each button stops propagation so it can run its own action) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-black/[0.03] opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            aria-label="Add to cart"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Cart-add logic is handled by the dedicated cart page / SDK on /product/[slug];
              // we navigate to the product detail so the customer can pick quantity.
              window.location.href = `/product/${product.slug}`;
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-traford-green text-white transition hover:scale-110 hover:bg-traford-green-dark"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/product/${product.slug}`;
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-traford-orange text-white transition hover:scale-110 hover:bg-traford-orange-dark"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <h3 className="mt-3 line-clamp-2 text-sm font-normal leading-snug text-gray-700">
        {product.name}
      </h3>

      <div className="mt-1.5 font-display text-base font-semibold text-traford-red">
        {formatUGX(product.price)}
        {product.unit ? (
          <span className="ml-1 text-[11px] font-normal text-gray-500">/ {product.unit}</span>
        ) : null}
      </div>

      <span className="font-display mx-auto mt-2 inline-block rounded bg-traford-green px-5 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
        Add to Cart
      </span>
    </Link>
  );
}

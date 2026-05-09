import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus, Star } from 'lucide-react';
import type { Product } from '@/lib/supabase/types';
import { formatUGX } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-traford-border bg-white transition hover:shadow-md">
      {/* Image */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[1.05] overflow-hidden bg-traford-mint"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🥗</div>
        )}

        {/* Wishlist heart */}
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-traford-dark shadow hover:text-traford-orange"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>

        {/* Discount badge */}
        {product.has_discount && product.discount_percent ? (
          <span className="absolute left-2 top-2 rounded-full bg-traford-orange px-2 py-0.5 text-[10px] font-bold text-white">
            -{product.discount_percent}%
          </span>
        ) : null}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-1 text-sm font-semibold text-traford-dark hover:text-traford-orange"
        >
          {product.name}
        </Link>
        <div className="text-[11px] text-traford-muted">per {product.unit}</div>

        {product.rating > 0 ? (
          <div className="flex items-center gap-1 text-[11px] text-traford-muted">
            <Star className="h-3 w-3 fill-traford-star text-traford-star" />
            <span>{product.rating.toFixed(1)}</span>
            <span>({product.review_count})</span>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="text-sm font-bold text-traford-orange">
            {formatUGX(product.price)}
          </div>
          <button
            type="button"
            aria-label="Add to cart"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-traford-green text-white transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

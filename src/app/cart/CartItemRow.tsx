'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart, type LocalCartLine } from '@/lib/cart-store';
import { formatUGX } from '@/lib/format';

interface Props {
  productId: string | number;
  quantity: number;
  product: LocalCartLine['product'];
}

export function CartItemRow({ productId, quantity, product }: Props) {
  const { updateQuantity, removeFromCart } = useCart();

  const dec = () => {
    if (quantity <= 1) return;
    updateQuantity(productId, quantity - 1);
  };
  const inc = () => {
    if (product.stock && quantity >= product.stock) return;
    updateQuantity(productId, quantity + 1);
  };
  const remove = () => removeFromCart(productId);

  return (
    <div className="card flex gap-3">
      <Link
        href={`/product/${product.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-traford-mint sm:h-24 sm:w-24"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            🥗
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/product/${product.slug}`}
            className="font-semibold text-traford-dark hover:text-traford-orange"
          >
            {product.name}
          </Link>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove"
            className="text-traford-muted hover:text-traford-orange"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-traford-muted">per {product.unit}</div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-center rounded-full border border-traford-border">
            <button
              type="button"
              onClick={dec}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-l-full hover:bg-traford-mint disabled:opacity-50"
              aria-label="Decrease"
            >
              <Minus className="h-3 w-3" />
            </button>
            <div className="w-8 text-center text-sm font-semibold">
              {quantity}
            </div>
            <button
              type="button"
              onClick={inc}
              disabled={!!product.stock && quantity >= product.stock}
              className="flex h-8 w-8 items-center justify-center rounded-r-full hover:bg-traford-mint disabled:opacity-50"
              aria-label="Increase"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="text-sm font-bold text-traford-orange">
            {formatUGX(product.price * quantity)}
          </div>
        </div>
      </div>
    </div>
  );
}

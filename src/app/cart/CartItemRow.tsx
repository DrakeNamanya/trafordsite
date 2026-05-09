'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatUGX } from '@/lib/format';

interface Props {
  cartItemId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    unit: string;
    image_url: string | null;
    stock: number;
  };
}

export function CartItemRow({ cartItemId, quantity: initialQty, product }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(initialQty);
  const [pending, startTransition] = useTransition();

  const updateQty = (newQty: number) => {
    if (newQty < 1) return;
    if (newQty > product.stock) return;
    setQty(newQty);
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', cartItemId);
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from('cart_items').delete().eq('id', cartItemId);
      router.refresh();
    });
  };

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
            disabled={pending}
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
              onClick={() => updateQty(qty - 1)}
              disabled={pending || qty <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-l-full hover:bg-traford-mint disabled:opacity-50"
              aria-label="Decrease"
            >
              <Minus className="h-3 w-3" />
            </button>
            <div className="w-8 text-center text-sm font-semibold">{qty}</div>
            <button
              type="button"
              onClick={() => updateQty(qty + 1)}
              disabled={pending || qty >= product.stock}
              className="flex h-8 w-8 items-center justify-center rounded-r-full hover:bg-traford-mint disabled:opacity-50"
              aria-label="Increase"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="text-sm font-bold text-traford-orange">
            {formatUGX(product.price * qty)}
          </div>
        </div>
      </div>
    </div>
  );
}

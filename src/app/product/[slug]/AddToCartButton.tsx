'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = () => {
    setMessage(null);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/product`);
        return;
      }

      // Upsert cart_items: if exists for (user_id, product_id), increment qty
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + qty })
          .eq('id', existing.id);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity: qty,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      setMessage('Added to cart ✓');
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-traford-border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-traford-dark hover:bg-traford-mint rounded-l-full"
            aria-label="Decrease"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="w-10 text-center text-sm font-semibold">{qty}</div>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center text-traford-dark hover:bg-traford-mint rounded-r-full"
            aria-label="Increase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || pending}
          className="btn-primary flex-1"
        >
          <ShoppingCart className="h-4 w-4" />
          {pending ? 'Adding…' : 'Add to cart'}
        </button>
      </div>

      {message && (
        <div className="text-sm text-traford-green font-medium">{message}</div>
      )}
    </div>
  );
}

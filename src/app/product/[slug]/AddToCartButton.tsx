'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import type { ApiProduct } from '@/lib/api';

export function AddToCartButton({
  product,
  disabled,
}: {
  product: ApiProduct;
  disabled?: boolean;
}) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = () => {
    addToCart(product, qty);
    setMessage('Added to cart ✓');
    window.setTimeout(() => setMessage(null), 1500);
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
          disabled={disabled}
          className="btn-primary flex-1"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to cart
        </button>
      </div>

      {message && (
        <div className="text-sm text-traford-green font-medium">{message}</div>
      )}
    </div>
  );
}

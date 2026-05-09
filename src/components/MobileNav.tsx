'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import type { Category } from '@/lib/supabase/types';

/**
 * Mobile menu drawer. Hidden on md+ screens, replaces the desktop category nav
 * on small viewports. Uses a self-managed state since it's a client component.
 */
export function MobileNav({
  categories,
  isAuthed,
}: {
  categories: Pick<Category, 'id' | 'name' | 'slug'>[];
  isAuthed: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
        className="text-gray-600 transition hover:text-traford-green md:hidden"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[70px] z-50 border-b-2 border-traford-green bg-white shadow-lg md:hidden">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="font-display block border-b border-gray-100 px-5 py-3 text-sm uppercase text-traford-text transition hover:bg-gray-50 hover:text-traford-green"
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="font-display block border-b border-gray-100 px-5 py-3 text-sm uppercase text-traford-text transition hover:bg-gray-50 hover:text-traford-green"
          >
            Shop
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              onClick={() => setOpen(false)}
              className="font-display block border-b border-gray-100 px-5 py-3 text-sm uppercase text-traford-text transition hover:bg-gray-50 hover:text-traford-green"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="font-display block border-b border-gray-100 px-5 py-3 text-sm uppercase text-traford-text transition hover:bg-gray-50 hover:text-traford-green"
          >
            About
          </Link>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="font-display block border-b border-gray-100 px-5 py-3 text-sm uppercase text-traford-text transition hover:bg-gray-50 hover:text-traford-green"
          >
            Contact
          </Link>
          <Link
            href={isAuthed ? '/account' : '/login'}
            onClick={() => setOpen(false)}
            className="font-display block px-5 py-3 text-sm uppercase text-traford-text transition hover:bg-gray-50 hover:text-traford-green"
          >
            {isAuthed ? 'My Account' : 'Login / Register'}
          </Link>
        </div>
      )}
    </>
  );
}

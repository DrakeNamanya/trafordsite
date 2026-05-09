import Link from 'next/link';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/supabase/types';

/**
 * Dark 4-column footer matching the reference design exactly.
 * Categories list is fed live from Supabase so it stays in sync with the catalogue.
 */
export async function Footer() {
  const supabase = await createClient();
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .limit(8);

  const categories = (categoriesData ?? []) as Pick<Category, 'id' | 'name' | 'slug'>[];

  return (
    <footer className="bg-traford-dark text-gray-300">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand column */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-traford-green">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="font-display text-lg text-white">
              Traford <span className="text-traford-orange">Farm Fresh</span>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-gray-400">
            Premium fresh fruits, vegetables, spices, herbs and seafood sourced from
            Uganda's finest farms. Quality guaranteed from farm to your door.
          </p>
          <div className="mt-3 flex gap-2.5">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-gray-400 transition hover:bg-traford-green hover:text-white"
            >
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-gray-400 transition hover:bg-traford-green hover:text-white"
            >
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-gray-400 transition hover:bg-traford-green hover:text-white"
            >
              <Twitter className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display mb-4 text-base text-white">Quick Links</h4>
          <ul className="space-y-2 text-[13px]">
            <li><Link href="/" className="text-gray-400 transition hover:text-traford-green">Home</Link></li>
            <li><Link href="/shop" className="text-gray-400 transition hover:text-traford-green">Shop</Link></li>
            <li><Link href="/about" className="text-gray-400 transition hover:text-traford-green">About Us</Link></li>
            <li><Link href="/contact" className="text-gray-400 transition hover:text-traford-green">Contact</Link></li>
            <li><Link href="/account" className="text-gray-400 transition hover:text-traford-green">My Account</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-display mb-4 text-base text-white">Categories</h4>
          <ul className="space-y-2 text-[13px]">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="text-gray-400 transition hover:text-traford-green"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-gray-500 italic text-[12px]">Coming soon</li>
            )}
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-display mb-4 text-base text-white">Contact Us</h4>
          <ul className="space-y-2 text-[13px] text-gray-400">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-traford-green" />
              <span>Kampala, Uganda</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-traford-green" />
              <a href="tel:+256700000000" className="hover:text-traford-green">+256 700 000 000</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-traford-green" />
              <a href="mailto:info@trafordexport.com" className="hover:text-traford-green">
                info@trafordexport.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-traford-green" />
              <span>Mon–Sat 8AM–6PM</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 py-5 text-center text-[12px] text-gray-500">
        © {new Date().getFullYear()} Traford Farm Fresh. All Rights Reserved. | ISO 9001:2015 | ISO 22000:2018 | ISO 14001:2015
      </div>
    </footer>
  );
}

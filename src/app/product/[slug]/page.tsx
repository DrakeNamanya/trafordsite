import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Truck, Shield, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatUGX } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';
import { AddToCartButton } from './AddToCartButton';
import type { Product } from '@/lib/supabase/types';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('audience', 'public')
    .maybeSingle();

  if (!product) notFound();
  const p = product as Product;

  // Related items in same category
  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('audience', 'public')
    .eq('category_id', p.category_id ?? '')
    .neq('id', p.id)
    .limit(4);

  const relatedProducts = (related ?? []) as Product[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-xs text-traford-muted">
        <Link href="/" className="hover:text-traford-orange">
          Home
        </Link>
        {' / '}
        <Link href="/shop" className="hover:text-traford-orange">
          Shop
        </Link>
        {' / '}
        <span className="text-traford-dark">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-traford-mint">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-9xl">
              🥗
            </div>
          )}
          {p.has_discount && p.discount_percent ? (
            <span className="absolute left-4 top-4 rounded-full bg-traford-orange px-3 py-1 text-sm font-bold text-white">
              -{p.discount_percent}% OFF
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-extrabold text-traford-dark sm:text-3xl">
            {p.name}
          </h1>
          <div className="mt-1 text-sm text-traford-muted">per {p.unit}</div>

          {p.rating > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(p.rating)
                        ? 'fill-traford-star text-traford-star'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-traford-muted">
                {p.rating.toFixed(1)} ({p.review_count} reviews)
              </span>
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <div className="text-3xl font-extrabold text-traford-orange">
              {formatUGX(p.price)}
            </div>
            {p.compare_at_price && p.compare_at_price > p.price && (
              <div className="text-base text-traford-muted line-through">
                {formatUGX(p.compare_at_price)}
              </div>
            )}
          </div>

          <div className="mt-2 text-sm">
            {p.stock > 0 ? (
              <span className="text-traford-green">
                ✓ In stock ({p.stock} {p.unit})
              </span>
            ) : (
              <span className="text-traford-orange">Out of stock</span>
            )}
          </div>

          {p.description && (
            <p className="mt-5 text-sm leading-relaxed text-traford-dark">
              {p.description}
            </p>
          )}

          <div className="mt-6">
            <AddToCartButton productId={p.id} disabled={p.stock <= 0} />
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Badge icon={<Leaf className="h-4 w-4" />} label="100% Organic" />
            <Badge icon={<Truck className="h-4 w-4" />} label="Same-day" />
            <Badge icon={<Shield className="h-4 w-4" />} label="Quality assured" />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-traford-mint p-3 text-center">
      <div className="text-traford-green">{icon}</div>
      <div className="text-[11px] font-semibold text-traford-dark">{label}</div>
    </div>
  );
}

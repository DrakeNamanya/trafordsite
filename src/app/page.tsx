import Link from 'next/link';
import { Leaf, Truck, HandshakeIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
import { CategoryTile } from '@/components/CategoryTile';
import type { Product, Category } from '@/lib/supabase/types';

export const revalidate = 60; // ISR: refresh home every minute

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: featured }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('audience', 'public')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .limit(6),
  ]);

  const featuredProducts = (featured ?? []) as Product[];
  const topCategories = (categories ?? []) as Category[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl bg-traford-mint">
        <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-2">
          <div>
            <p className="mb-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-traford-green">
              Farm to Doorstep
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-traford-dark sm:text-4xl md:text-5xl">
              Eat Fresh.
              <br />
              <span className="text-traford-green">Stay Healthy.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-traford-muted sm:text-base">
              Shop fresh produce, meat, honey & groceries sourced directly from
              Ugandan farmers. Same-day delivery across Kampala.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                Shop now
              </Link>
              <Link href="/about" className="btn-outline">
                Learn more
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white sm:aspect-square">
            <div className="flex h-full w-full items-center justify-center text-7xl">
              🥬🍅🥑
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BAR */}
      <section className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-traford-border bg-white p-4 sm:grid-cols-3">
        <FeatureItem
          icon={<Leaf className="h-5 w-5 text-traford-green" />}
          title="100% Organic"
          subtitle="Hand-picked from local farms"
        />
        <FeatureItem
          icon={<Truck className="h-5 w-5 text-traford-orange" />}
          title="Fast Delivery"
          subtitle="Same-day across Kampala"
        />
        <FeatureItem
          icon={<HandshakeIcon className="h-5 w-5 text-traford-leaf" />}
          title="Fair Trade"
          subtitle="Empowering Ugandan farmers"
        />
      </section>

      {/* CATEGORIES */}
      {topCategories.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Shop by Category" href="/shop" />
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {topCategories.map((c) => (
              <CategoryTile key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featuredProducts.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="Featured Products" href="/shop" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* PROMO */}
      <section className="mt-10 overflow-hidden rounded-3xl bg-traford-mint p-8 text-center">
        <h2 className="text-2xl font-extrabold text-traford-dark sm:text-3xl">
          Eat Fresh, Stay Healthy
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-traford-muted">
          Discover seasonal favourites and stock up on essentials.
        </p>
        <Link href="/shop" className="btn-secondary mt-5">
          Explore More
        </Link>
      </section>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-traford-mint">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-traford-dark">{title}</div>
        <div className="text-xs text-traford-muted">{subtitle}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-traford-dark sm:text-xl">{title}</h2>
      <Link
        href={href}
        className="text-sm font-semibold text-traford-orange hover:underline"
      >
        See all →
      </Link>
    </div>
  );
}

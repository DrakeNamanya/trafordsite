import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  PhoneCall,
  Truck,
  CreditCard,
  ShoppingBag,
  Apple as AppleIcon,
} from 'lucide-react';
import { CategoryTabs } from '@/components/CategoryTabs';
import { fetchCategories, fetchProducts } from '@/lib/api';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const revalidate = 60; // ISR: refresh home every minute

export default async function HomePage() {
  const [allProducts, allCategories] = await Promise.all([
    fetchProducts({ limit: 16 }).catch(() => []),
    fetchCategories().catch(() => []),
  ]);

  // Public API may return everything; trim to top-level (no parent) and cap to 9
  const topCategories = allCategories
    .filter((c) => c.parent_id === null || c.parent_id === undefined)
    .slice(0, 9);

  return (
    <>
      {/* HERO — full-bleed green with diagonal split */}
      <section className="relative min-h-[420px] overflow-hidden bg-traford-green">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&h=800&fit=crop"
            alt="Fresh produce abundance"
            fill
            priority
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #3aaa35 40%, transparent 40%)',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[420px] max-w-[1200px] items-center px-4 py-16">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl font-bold uppercase leading-[1.05] text-white drop-shadow-md sm:text-6xl md:text-[64px]">
              Farm - Fresh
              <br />
              Abundance
            </h1>
            <p className="mt-4 max-w-md text-base text-white/90">
              Premium fresh fruits, vegetables, spices, herbs and seafood
              sourced directly from Uganda&apos;s finest farms.
            </p>
            <Link
              href="/shop"
              className="font-display mt-6 inline-flex items-center gap-2 rounded bg-traford-orange px-9 py-3.5 text-base font-semibold uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-traford-orange-dark"
            >
              <ShoppingBag className="h-4 w-4" />
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS + PRODUCT GRID */}
      <CategoryTabs categories={topCategories} products={allProducts} />

      {/* HOW IT WORKS */}
      <section className="bg-white py-16">
        <h2 className="font-display mb-10 text-center text-3xl uppercase text-gray-800">
          How It Works
        </h2>
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-8 px-4 md:grid-cols-4">
          <Step
            color="bg-traford-green"
            icon={<Store className="h-8 w-8 text-white" />}
            title="Order"
            text="Browse our online store and place your order from any device"
          />
          <Step
            color="bg-traford-orange"
            icon={<PhoneCall className="h-8 w-8 text-white" />}
            title="Confirm"
            text="We call to confirm your delivery address and preferred time"
          />
          <Step
            color="bg-blue-600"
            icon={<Truck className="h-8 w-8 text-white" />}
            title="Deliver"
            text="We deliver fresh produce at your own convenience"
          />
          <Step
            color="bg-purple-600"
            icon={<CreditCard className="h-8 w-8 text-white" />}
            title="Pay"
            text="Pay securely via MTN MoMo, Airtel Money, FlexiPay or cash"
          />
        </div>
      </section>

      <section className="border-y border-traford-border bg-[#f7f7f7] py-6 text-center">
        <h3 className="font-display text-xl uppercase text-traford-green">
          ISO Certified
        </h3>
        <p className="mt-1 text-[13px] text-gray-600">
          ISO 14001:2015 &nbsp;&nbsp; ISO 45001:2018 &nbsp;&nbsp; ISO 9001:2015
          &nbsp;&nbsp; ISO 22000:2018
        </p>
      </section>

      <section className="bg-traford-green py-12 text-center">
        <h2 className="font-display text-3xl uppercase text-white">
          Download Our App!
        </h2>
        <p className="mt-2 text-sm text-white/85">
          Get the Traford Farm Fresh app for a faster shopping experience
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="#"
            className="flex items-center gap-2.5 rounded-md bg-black/25 px-6 py-3 text-white transition hover:-translate-y-0.5 hover:bg-black/40"
          >
            <Store className="h-7 w-7" />
            <div className="text-left leading-tight">
              <small className="text-[10px] opacity-80">GET IT ON</small>
              <div className="text-[15px] font-semibold">Google Play</div>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-2.5 rounded-md bg-black/25 px-6 py-3 text-white transition hover:-translate-y-0.5 hover:bg-black/40"
          >
            <AppleIcon className="h-7 w-7" />
            <div className="text-left leading-tight">
              <small className="text-[10px] opacity-80">Download on the</small>
              <div className="text-[15px] font-semibold">App Store</div>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}

function Step({
  color,
  icon,
  title,
  text,
}: {
  color: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${color}`}
      >
        {icon}
      </div>
      <h3 className="font-display mb-2 text-lg uppercase text-gray-800">
        {title}
      </h3>
      <p className="text-[13px] leading-relaxed text-gray-500">{text}</p>
    </div>
  );
}

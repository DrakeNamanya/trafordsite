import { Suspense } from 'react';
import { Tractor, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import { SupplierForm } from './SupplierForm';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';

export default function SupplierPage() {
  return (
    <>
      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-traford-green py-14 text-white">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 60%, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px, 60px 60px',
            }}
          />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Tractor className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl uppercase sm:text-4xl">
            Become Our Supplier
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            Are you a farmer, grower, or producer in Uganda? Partner with
            Traford to bring your fresh produce to customers across the
            country.
          </p>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="bg-white py-10">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-4 sm:grid-cols-3">
          <ValueCard
            icon={<Truck className="h-6 w-6 text-traford-green" />}
            title="Reliable orders"
            text="Get consistent, scheduled orders from our growing customer base."
          />
          <ValueCard
            icon={<ShieldCheck className="h-6 w-6 text-traford-green" />}
            title="Fair pricing"
            text="Transparent pricing — we negotiate fairly based on quality and quantity."
          />
          <ValueCard
            icon={<BadgeCheck className="h-6 w-6 text-traford-green" />}
            title="Trusted brand"
            text="Be part of an ISO-certified Ugandan brand customers love."
          />
        </div>
      </section>

      {/* FORM */}
      <section className="bg-traford-bg py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-lg border border-traford-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl uppercase text-traford-green">
              Tell us about your produce
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the form and our supplier team will get back to you
              within 2&ndash;3 business days.
            </p>
            <Suspense
              fallback={<div className="mt-6 text-sm">Loading form…</div>}
            >
              <SupplierForm />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}

function ValueCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-traford-border bg-white p-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-traford-green/10">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-sm uppercase text-traford-dark">
          {title}
        </h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">
          {text}
        </p>
      </div>
    </div>
  );
}

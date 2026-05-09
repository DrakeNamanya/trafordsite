import Link from 'next/link';
import { Leaf, Truck, HandshakeIcon, Heart } from 'lucide-react';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';

export const metadata = {
  title: 'About — Traford Farm Fresh',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-traford-mint p-8 sm:p-12">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          From Ugandan Farms to Your Doorstep
        </h1>
        <p className="mt-3 max-w-2xl text-traford-muted">
          Traford Farm Fresh connects you directly with local farmers, delivering
          organic produce, meat, honey, and groceries — fresh, fast, and fair.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Pillar
          icon={<Leaf className="h-5 w-5" />}
          title="Organic & Local"
          text="Hand-picked produce from trusted Ugandan farms — no middlemen, no waste."
        />
        <Pillar
          icon={<Truck className="h-5 w-5" />}
          title="Same-day Delivery"
          text="Order before noon and get fresh groceries delivered across Kampala the same day."
        />
        <Pillar
          icon={<HandshakeIcon className="h-5 w-5" />}
          title="Fair to Farmers"
          text="We pay our farmers fairly and transparently, supporting rural livelihoods."
        />
        <Pillar
          icon={<Heart className="h-5 w-5" />}
          title="Quality You Can Taste"
          text="Every item is quality-checked before it leaves our pack-house."
        />
      </section>

      <section className="mt-10 text-center">
        <Link href="/shop" className="btn-primary">
          Start shopping
        </Link>
      </section>
    </div>
  );
}

function Pillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-traford-mint text-traford-green">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-traford-muted">{text}</p>
    </div>
  );
}

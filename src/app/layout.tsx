import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartProviderRoot } from '@/components/CartProviderRoot';

// Cloudflare Pages: root layout renders <Header /> which is an async Server
// Component that calls Supabase, so the layout itself must opt into the edge
// runtime. Without this, next-on-pages falls back to Node and throws 500 on
// every page render.
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Traford Farm Fresh — Fresh from the Farm',
  description:
    'Shop fresh produce, meat, honey, and groceries from Uganda. Eat fresh. Stay healthy.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-traford-bg text-traford-text antialiased">
        <CartProviderRoot>
          <Header />
          <main className="min-h-[calc(100vh-200px)]">{children}</main>
          <Footer />
        </CartProviderRoot>
      </body>
    </html>
  );
}

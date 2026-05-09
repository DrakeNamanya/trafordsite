import Link from 'next/link';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';

export const metadata = {
  title: 'Page not found — Traford Farm Fresh',
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-4xl font-extrabold text-traford-dark">404</h1>
      <p className="mt-3 text-traford-muted">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-block">
        Back to home
      </Link>
    </div>
  );
}

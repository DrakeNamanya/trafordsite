import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './LoginForm';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-traford-dark">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-traford-muted">
          Sign in to continue shopping fresh.
        </p>
        <Suspense fallback={<div className="mt-6 text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
        <div className="mt-6 text-center text-sm text-traford-muted">
          New to Traford?{' '}
          <Link
            href="/signup"
            className="font-semibold text-traford-orange hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

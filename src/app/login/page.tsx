import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';

export default function LoginPage() {
  return (
    <>
      <div className="page-banner">
        <h1>Login</h1>
        <p>Sign in to your Traford Farm Fresh account</p>
      </div>
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-traford-border bg-white p-8 shadow-sm">
          <h2 className="font-display text-2xl uppercase text-traford-green">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue shopping fresh.
          </p>
          <Suspense fallback={<div className="mt-6 text-sm">Loading…</div>}>
            <LoginForm />
          </Suspense>
          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-traford-green hover:underline"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

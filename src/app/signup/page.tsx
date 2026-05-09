import { Suspense } from 'react';
import Link from 'next/link';
import { SignupForm } from './SignupForm';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';

export default function SignupPage() {
  return (
    <>
      <div className="page-banner">
        <h1>Register</h1>
        <p>Create your Traford Farm Fresh account</p>
      </div>
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="rounded-lg border border-traford-border bg-white p-8 shadow-sm">
          <h2 className="font-display text-2xl uppercase text-traford-green">
            Create Account
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Join Traford to shop fresh from Ugandan farms.
          </p>
          <Suspense fallback={<div className="mt-6 text-sm">Loading…</div>}>
            <SignupForm />
          </Suspense>
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-traford-green hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

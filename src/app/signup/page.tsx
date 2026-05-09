import { Suspense } from 'react';
import Link from 'next/link';
import { SignupForm } from './SignupForm';

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-traford-dark">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-traford-muted">
          Join Traford to shop fresh from Ugandan farms.
        </p>
        <Suspense fallback={<div className="mt-6 text-sm">Loading…</div>}>
          <SignupForm />
        </Suspense>
        <div className="mt-6 text-center text-sm text-traford-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-traford-orange hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

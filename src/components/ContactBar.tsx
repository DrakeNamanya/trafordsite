import Link from 'next/link';
import { Phone, Mail, ShoppingCart } from 'lucide-react';
import { CartCountBadge } from './CartCountBadge';

/**
 * Green contact bar with phone/email on the left and auth links + cart on the right.
 * Server component — receives the user from the parent Header so we don't double-fetch.
 */
export function ContactBar({
  isAuthed,
  userName,
}: {
  isAuthed: boolean;
  userName?: string | null;
}) {
  return (
    <div className="bg-traford-green text-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[13px]">
        {/* Left: contact info */}
        <div className="flex items-center gap-5">
          <a
            href="tel:+256700000000"
            className="flex items-center gap-1.5 transition hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            (+256) 700 000 000
          </a>
          <a
            href="mailto:info@trafordexport.com"
            className="hidden items-center gap-1.5 transition hover:underline sm:flex"
          >
            <Mail className="h-3.5 w-3.5" />
            info@trafordexport.com
          </a>
        </div>

        {/* Right: auth + cart */}
        <div className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <Link href="/account" className="transition hover:underline">
                {userName ? `Hi, ${userName.split(' ')[0]}` : 'My Account'}
              </Link>
              <span className="opacity-50">/</span>
              <Link href="/account/orders" className="transition hover:underline">
                Orders
              </Link>
              <span className="opacity-50">/</span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="transition hover:underline">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="transition hover:underline">
                Login
              </Link>
              <span className="opacity-50">/</span>
              <Link href="/signup" className="transition hover:underline">
                Register
              </Link>
              <span className="opacity-50">/</span>
              <Link href="/account" className="transition hover:underline">
                My Account
              </Link>
            </>
          )}
          <Link
            href="/cart"
            className="ml-1 flex items-center gap-1.5 transition hover:underline"
            aria-label="Cart"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <CartCountBadge variant="text" />
          </Link>
        </div>
      </div>
    </div>
  );
}

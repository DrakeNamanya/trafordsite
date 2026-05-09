import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-traford-border bg-traford-mint">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-traford-orange text-white font-bold">
              T
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold">Traford</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-traford-green">
                Farm Fresh
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-traford-muted">
            Fresh produce, meat, honey & groceries from Ugandan farmers — straight to your door.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-traford-muted">
            <li><Link href="/shop" className="hover:text-traford-orange">All products</Link></li>
            <li><Link href="/shop?category=fresh-produce" className="hover:text-traford-orange">Fresh produce</Link></li>
            <li><Link href="/shop?category=meat-and-poultry" className="hover:text-traford-orange">Meat & poultry</Link></li>
            <li><Link href="/shop?category=honey" className="hover:text-traford-orange">Honey</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Account</h4>
          <ul className="space-y-2 text-sm text-traford-muted">
            <li><Link href="/login" className="hover:text-traford-orange">Sign in</Link></li>
            <li><Link href="/signup" className="hover:text-traford-orange">Create account</Link></li>
            <li><Link href="/account/orders" className="hover:text-traford-orange">My orders</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-traford-muted">
            <li><Link href="/about" className="hover:text-traford-orange">About us</Link></li>
            <li><Link href="/contact" className="hover:text-traford-orange">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-traford-orange">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-traford-orange">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-traford-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-traford-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Traford Farm Fresh. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

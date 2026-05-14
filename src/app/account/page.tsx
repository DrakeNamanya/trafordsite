import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, MapPin, User as UserIcon, Sprout } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './SignOutButton';
import { formatUGX, formatDate } from '@/lib/format';
import type { Profile, Order } from '@/lib/supabase/types';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Status badges so users can see at a glance where each order is in its
// lifecycle. Mirrors the colour coding used on /account/orders.
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

// Supplier-application status colour map. The `suppliers.status` column uses
// the lifecycle: pending → reviewing → approved | rejected, plus an
// 'on_hold' fallback some legacy rows have.
const SUPPLIER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  under_review: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function statusLabel(s: string): string {
  // 'out_for_delivery' -> 'Out for delivery'
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Minimal supplier row shape — we only render a few columns.
interface SupplierApplication {
  id: string;
  product: string | null;
  quantity: string | null;
  frequency: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  const profile = profileData as Profile | null;

  // Fetch recent orders directly so users see status badges right on /account
  // (confirmed / processing / out_for_delivery / delivered / cancelled).
  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  const recentOrders = (ordersData ?? []) as Order[];

  const { count: orderCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch the user's supplier applications. Legacy rows may have user_id=null
  // (the form used to be anonymous) so we also match on email/phone from the
  // signed-in profile to surface those too.
  const supplierFilters: string[] = [`user_id.eq.${user.id}`];
  if (user.email) supplierFilters.push(`email.eq.${user.email}`);
  if (profile?.phone) supplierFilters.push(`phone.eq.${profile.phone}`);

  const { data: supplierData } = await supabase
    .from('suppliers')
    .select('id, product, quantity, frequency, status, admin_notes, created_at')
    .or(supplierFilters.join(','))
    .order('created_at', { ascending: false })
    .limit(5);
  const supplierApplications = (supplierData ?? []) as SupplierApplication[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">My account</h1>

      {/* Profile summary */}
      <section className="card mt-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-traford-mint">
          <UserIcon className="h-6 w-6 text-traford-green" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-traford-dark">
            {profile?.full_name ?? 'Welcome'}
          </div>
          <div className="text-sm text-traford-muted">{user.email}</div>
          {profile?.role && profile.role !== 'customer' && (
            <span className="mt-1 inline-block rounded-full bg-traford-mint px-2 py-0.5 text-[10px] font-semibold text-traford-green uppercase">
              {profile.role}
            </span>
          )}
        </div>
        <SignOutButton />
      </section>

      {/* Quick links */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <AccountTile
          href="/account/orders"
          icon={<Package className="h-5 w-5" />}
          title="My orders"
          subtitle={`${orderCount ?? 0} order${orderCount === 1 ? '' : 's'}`}
        />
        <AccountTile
          href="/account/addresses"
          icon={<MapPin className="h-5 w-5" />}
          title="Addresses"
          subtitle="Manage delivery addresses"
        />
      </section>

      {/* Recent orders with live status — mirrors /account/orders so the user
          can see confirmed / processing / delivered etc. without an extra click */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-traford-dark">Recent orders</h2>
          {recentOrders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-xs font-semibold uppercase tracking-wide text-traford-green hover:text-traford-green-dark"
            >
              View all →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="card text-center">
            <Package className="mx-auto h-10 w-10 text-traford-muted" />
            <p className="mt-3 text-traford-muted">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/shop" className="btn-primary mt-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="card flex items-center justify-between gap-3 transition hover:border-traford-orange"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-traford-dark">
                    {order.order_number}
                  </div>
                  <div className="text-xs text-traford-muted">
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-traford-orange">
                    {formatUGX(order.total)}
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Supplier applications — surfaces the status of the "Become a Supplier"
          submission so the user can see at a glance whether their application
          is pending, reviewing, approved, or rejected. */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-traford-dark">
            My supplier applications
          </h2>
          <Link
            href="/become-supplier"
            className="text-xs font-semibold uppercase tracking-wide text-traford-green hover:text-traford-green-dark"
          >
            New application →
          </Link>
        </div>

        {supplierApplications.length === 0 ? (
          <div className="card text-center">
            <Sprout className="mx-auto h-10 w-10 text-traford-muted" />
            <p className="mt-3 text-traford-muted">
              You haven&apos;t applied to become a supplier yet.
            </p>
            <Link href="/become-supplier" className="btn-primary mt-4">
              Become a supplier
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {supplierApplications.map((app) => (
              <div
                key={app.id}
                className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-traford-dark">
                    {app.product ?? 'Supplier application'}
                  </div>
                  <div className="text-xs text-traford-muted">
                    {[app.quantity, app.frequency].filter(Boolean).join(' · ') ||
                      'Application'}
                    {' • Submitted '}
                    {formatDate(app.created_at)}
                  </div>
                  {app.admin_notes && (
                    <div className="mt-1 text-xs text-traford-muted">
                      <span className="font-semibold text-traford-dark">
                        Note from team:
                      </span>{' '}
                      {app.admin_notes}
                    </div>
                  )}
                </div>
                <span
                  className={`inline-block self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase sm:self-auto ${
                    SUPPLIER_STATUS_STYLES[app.status] ??
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabel(app.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AccountTile({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-4 transition hover:border-traford-orange"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-traford-mint text-traford-green">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-traford-dark">{title}</div>
        <div className="text-xs text-traford-muted">{subtitle}</div>
      </div>
    </Link>
  );
}

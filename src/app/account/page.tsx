import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, MapPin, LogOut, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './SignOutButton';
import type { Profile } from '@/lib/supabase/types';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

  const { count: orderCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

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

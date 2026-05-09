import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';


// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface Address {
  id: string;
  full_name: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  is_default: boolean | null;
}

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/addresses');

  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  const addresses = (data ?? []) as Address[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Addresses</h1>
        <Link
          href="/account"
          className="text-sm text-traford-muted hover:text-traford-orange"
        >
          ← Back
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="card text-center">
          <MapPin className="mx-auto h-10 w-10 text-traford-muted" />
          <p className="mt-3 text-traford-muted">
            No saved addresses yet. Add one when placing your next order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{a.full_name}</div>
                  <div className="text-sm text-traford-muted">{a.phone}</div>
                  <div className="mt-1 text-sm">
                    {a.address_line}, {a.city}
                  </div>
                </div>
                {a.is_default && (
                  <span className="rounded-full bg-traford-mint px-2 py-0.5 text-[10px] font-semibold uppercase text-traford-green">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

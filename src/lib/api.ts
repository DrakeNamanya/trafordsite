/**
 * Public REST client for the Traford Fresh shared backend.
 *
 *   Base URL: https://trafordfresh.pages.dev/api/public
 *
 * This is the same surface the Flutter app (`trafordapp`) talks to, so
 * categories, prices, totals, shipping fees and order numbers stay in lockstep
 * across the website and the mobile app.
 *
 * Why not Supabase-direct? The /api/public endpoints:
 *   - Server-side validate audience='public' so we never leak agro inputs.
 *   - Compute the line-item totals, tax and shipping from app_settings.
 *   - For guest checkout, create the auth.users row + profile shell behind
 *     the scenes so the foreign key on orders.user_id is always satisfied.
 *   - Assign the canonical TFF-YYYY-NNNNNN order number via trigger.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_TRAFORD_API_BASE ??
  'https://trafordfresh.pages.dev/api/public';

export interface ApiProduct {
  id: string | number;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | number | null;
  price: number;
  original_price?: number | null;
  compare_at_price?: number | null;
  image_url: string | null;
  stock: number;
  unit: string;
  is_featured: boolean;
  rating: number;
  review_count: number;
  has_discount?: boolean;
  discount_percent?: number | null;
}

export interface ApiCategory {
  id: string | number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | number | null;
  image_url: string | null;
  emoji?: string | null;
  sort_order?: number;
}

export interface GuestCheckoutItem {
  product_id: string | number;
  quantity: number;
}

export interface GuestCheckoutPayload {
  full_name: string;
  phone: string;
  email?: string;
  delivery_address: string;
  delivery_city?: string;
  notes?: string;
  items: GuestCheckoutItem[];
  /**
   * 'delivery' (default — charges the configured shipping fee) or 'pickup'
   * (no shipping fee, customer collects from the outlet). The server reads
   * either `delivery_method` or `fulfillment` so both clients stay in sync.
   */
  delivery_method?: 'delivery' | 'pickup';
}

export interface GuestCheckoutResponse {
  order?: {
    id: string | number;
    order_number: string;
    status: string;
    subtotal: number;
    shipping_cost?: number;
    total: number;
    [key: string]: unknown;
  };
  order_number?: string;
  status?: string;
  total?: number;
  [key: string]: unknown;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * Normalise PostgREST/edge responses that may come back as either
 *   - a bare array:        `[ {...}, {...} ]`
 *   - a wrapped envelope:  `{ data: [...] }`
 * Returning a consistent array prevents the entire site from 500-ing when
 * the upstream API shape drifts between deploys.
 */
function unwrapList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object') {
    const maybe = (body as { data?: unknown }).data;
    if (Array.isArray(maybe)) return maybe as T[];
  }
  return [];
}

export async function fetchProducts(opts: {
  search?: string;
  categoryId?: string | number;
  limit?: number;
} = {}): Promise<ApiProduct[]> {
  const params = new URLSearchParams();
  params.set('limit', String(opts.limit ?? 100));
  if (opts.search) params.set('search', opts.search);
  if (opts.categoryId !== undefined && opts.categoryId !== null) {
    params.set('category_id', String(opts.categoryId));
  }
  const body = await getJson<unknown>(`/products?${params.toString()}`);
  return unwrapList<ApiProduct>(body);
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const body = await getJson<unknown>(`/categories`);
  return unwrapList<ApiCategory>(body);
}

export async function fetchProductBySlug(slug: string): Promise<ApiProduct | null> {
  const products = await fetchProducts({ limit: 200 });
  return products.find((p) => p.slug === slug) ?? null;
}

export async function guestCheckout(
  payload: GuestCheckoutPayload
): Promise<GuestCheckoutResponse> {
  const res = await fetch(`${API_BASE}/orders/guest-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => null)) as
    | (GuestCheckoutResponse & { error?: string })
    | null;
  if (!res.ok) {
    const msg =
      json?.error ??
      `Guest checkout failed (${res.status} ${res.statusText})`;
    throw new Error(msg);
  }
  return json ?? {};
}

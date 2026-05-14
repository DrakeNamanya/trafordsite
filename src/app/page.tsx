import { CategoryTabs } from '@/components/CategoryTabs';
import { fetchCategories, fetchProducts } from '@/lib/api';

// Cloudflare Pages: run on the Workers edge runtime
export const runtime = 'edge';
export const revalidate = 60; // ISR: refresh home every minute

export default async function HomePage() {
  // Pull the FULL catalogue so visitors land on the page and can immediately
  // start shopping every product we sell (capped at 200 for sanity).
  const [allProducts, allCategories] = await Promise.all([
    fetchProducts({ limit: 200 }).catch(() => []),
    fetchCategories().catch(() => []),
  ]);

  // Top-level categories only — cap at 9 for the tab strip.
  const topCategories = allCategories
    .filter((c) => c.parent_id === null || c.parent_id === undefined)
    .slice(0, 9);

  return (
    <>
      {/* CATEGORY TABS + FULL PRODUCT GRID
          Land users straight on the catalogue — no marketing hero — so they
          can start shopping immediately. */}
      <CategoryTabs categories={topCategories} products={allProducts} />
    </>
  );
}

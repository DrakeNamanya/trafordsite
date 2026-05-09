import Link from 'next/link';
import type { Category } from '@/lib/supabase/types';

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-traford-mint p-4 text-center transition hover:bg-traford-mint2"
    >
      <div className="text-3xl">{category.emoji ?? '🛒'}</div>
      <div className="text-xs font-semibold text-traford-dark line-clamp-1">
        {category.name}
      </div>
    </Link>
  );
}

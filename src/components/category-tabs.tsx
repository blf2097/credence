'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { MarketCategory } from '@/lib/polymarket/types';

const CATS: MarketCategory[] = [
  'all',
  'politics',
  'crypto',
  'sports',
  'tech',
  'world',
];

export function CategoryTabs({ current }: { current: MarketCategory }) {
  const t = useTranslations('home.categories');
  const locale = useLocale();
  return (
    <div className="flex gap-2 overflow-x-auto">
      {CATS.map((c) => (
        <Link
          key={c}
          href={c === 'all' ? `/${locale}` : `/${locale}?cat=${c}`}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap',
            current === c
              ? 'bg-fg text-bg border-fg'
              : 'border-border text-fg-muted hover:text-fg hover:border-border-strong',
          )}
        >
          {t(c)}
        </Link>
      ))}
    </div>
  );
}

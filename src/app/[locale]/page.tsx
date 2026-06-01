import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { MarketList } from '@/components/market-list';
import { CategoryTabs } from '@/components/category-tabs';
import type { MarketCategory } from '@/lib/polymarket/types';

export default function HomePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { cat?: MarketCategory };
}) {
  unstable_setRequestLocale(locale);
  const cat: MarketCategory = searchParams.cat ?? 'all';
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Hero />
      <div className="mt-8">
        <CategoryTabs current={cat} />
      </div>
      <div className="mt-6">
        <MarketList category={cat} />
      </div>
    </div>
  );
}

function Hero() {
  const t = useTranslations('home.hero');
  return (
    <section className="rounded-2xl bg-bg-elevated border border-border px-8 py-12">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        {t('title')}
      </h1>
      <p className="mt-4 text-fg-muted text-lg max-w-2xl">{t('subtitle')}</p>
    </section>
  );
}

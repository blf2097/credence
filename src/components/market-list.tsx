import { listMarkets } from '@/lib/polymarket/gamma';
import type { MarketCategory } from '@/lib/polymarket/types';
import { MarketCard } from './market-card';
import { getTranslations } from 'next-intl/server';

export async function MarketList({ category }: { category: MarketCategory }) {
  const t = await getTranslations('errors');

  let markets;
  try {
    markets = await listMarkets({ category, limit: 24 });
  } catch (err) {
    console.error('[MarketList] gamma error:', err);
    return (
      <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center text-fg-muted">
        {t('network')}
      </div>
    );
  }

  if (!markets.length) {
    return (
      <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center text-fg-muted">
        {t('no_markets')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((m) => (
        <MarketCard key={m.id} market={m} />
      ))}
    </div>
  );
}

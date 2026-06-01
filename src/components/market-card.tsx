import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { GammaMarket } from '@/lib/polymarket/types';
import { formatProb, formatUSD } from '@/lib/utils';

export function MarketCard({ market }: { market: GammaMarket }) {
  const locale = useLocale();
  const yesPrice = parseFloat(market.outcomePrices?.[0] ?? '0');
  return (
    <Link
      href={`/${locale}/market/${market.id}`}
      className="block rounded-xl border border-border bg-bg-card hover:border-border-strong transition-colors p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-sm leading-snug line-clamp-3">
          {market.question}
        </h3>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold text-accent">
            {formatProb(yesPrice)}
          </div>
          <div className="text-xs text-fg-subtle">YES</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-fg-muted">
        <span>Vol {formatUSD(market.volume)}</span>
        <span>
          {market.endDate
            ? new Date(market.endDate).toLocaleDateString()
            : '—'}
        </span>
      </div>
    </Link>
  );
}

import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { GammaMarket } from '@/lib/polymarket/types';
import { formatProb, formatUSD } from '@/lib/utils';

export function MarketCard({ market }: { market: GammaMarket }) {
  const locale = useLocale();
  const yesPrice = parseFloat(market.outcomePrices?.[0] ?? '0');
  const category = market.category ? market.category.toUpperCase() : 'MARKET';

  return (
    <Link
      href={`/${locale}/market/${market.id}`}
      className="block rounded-xl border border-border bg-bg-card hover:border-border-strong transition-colors p-4 min-h-[168px]"
    >
      <div className="flex items-start gap-3">
        {market.icon || market.image ? (
          // Polymarket image URLs are allowlisted in next.config, but a plain img
          // keeps this card cheap and avoids layout constraints during D2.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={market.icon ?? market.image}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-bg-elevated shrink-0 border border-border grid place-items-center text-xs text-fg-subtle">
            C
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
            {category}
          </div>
          <h3 className="font-medium text-sm leading-snug line-clamp-3">
            {market.question}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold text-accent">
            {formatProb(yesPrice)}
          </div>
          <div className="text-xs text-fg-subtle">YES</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-fg-muted">
        <span>Vol {formatUSD(market.volumeNum)}</span>
        <span>24h {formatUSD(market.volume24hr ?? 0)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-fg-subtle">
        <span>Liq {formatUSD(market.liquidityNum)}</span>
        <span>
          {market.endDate
            ? new Date(market.endDate).toLocaleDateString()
            : '—'}
        </span>
      </div>
    </Link>
  );
}

import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { PredictionMarket } from '@/lib/core/market';
import { getPrimaryOutcome } from '@/lib/core/market';
import { formatProb, formatUSD } from '@/lib/utils';

export function MarketCard({ market }: { market: PredictionMarket }) {
  const locale = useLocale();
  const primaryOutcome = getPrimaryOutcome(market);
  const category = market.category ? market.category.toUpperCase() : market.kind.toUpperCase();
  const marketPathId = market.source.externalId;
  const isNative = market.provider === 'credence';

  return (
    <Link
      href={`/${locale}/market/${marketPathId}`}
      className="block rounded-xl border border-border bg-bg-card hover:border-border-strong transition-colors p-4 min-h-[168px]"
    >
      <div className="flex items-start gap-3">
        {market.icon || market.image ? (
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
            {isNative ? 'CREDENCE' : category} · {market.kind.toUpperCase()}
          </div>
          <h3 className="font-medium text-sm leading-snug line-clamp-3">
            {market.title}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold text-accent">
            {formatProb(primaryOutcome?.price ?? 0)}
          </div>
          <div className="text-xs text-fg-subtle">
            {primaryOutcome?.label.toUpperCase() ?? '—'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-fg-muted">
        <span>{isNative ? market.trading.mode : `Vol ${formatUSD(market.metrics.volume ?? 0)}`}</span>
        <span>{isNative ? market.settlementType : `24h ${formatUSD(market.metrics.volume24hr ?? 0)}`}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-fg-subtle">
        <span>Liq {formatUSD(market.metrics.liquidity ?? 0)}</span>
        <span>
          {market.endDate
            ? new Date(market.endDate).toLocaleDateString()
            : '—'}
        </span>
      </div>
    </Link>
  );
}

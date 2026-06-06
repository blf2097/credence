import { getPredictionMarket } from '@/lib/core/catalog';
import { getPrimaryOutcome } from '@/lib/core/market';
import { OrderForm } from '@/components/order-form';
import { OrderBookView } from '@/components/order-book-view';
import { RiskAcknowledgement } from '@/components/risk-acknowledgement';
import { formatProb, formatUSD } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';

export default async function MarketDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  unstable_setRequestLocale(params.locale);

  let market;
  try {
    market = await getPredictionMarket(params.id);
  } catch {
    notFound();
  }
  if (!market) notFound();

  const primaryOutcome = getPrimaryOutcome(market);

  return (
    <>
      <RiskAcknowledgement />
      <div className="mx-auto max-w-5xl px-4 py-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h1 className="text-2xl font-semibold">{market.title}</h1>
          <div className="flex items-center gap-6 text-sm text-fg-muted">
            <span>
              {primaryOutcome?.label.toUpperCase() ?? 'OUTCOME'}{' '}
              {formatProb(primaryOutcome?.price ?? 0)}
            </span>
            <span>Vol {formatUSD(market.metrics.volume ?? 0)}</span>
            <span>Liq {formatUSD(market.metrics.liquidity ?? 0)}</span>
            <span>
              Ends {market.endDate ? new Date(market.endDate).toLocaleDateString() : '—'}
            </span>
          </div>
          <p className="text-fg-muted whitespace-pre-line">
            {market.description}
          </p>
          <OrderBookView tokenId={primaryOutcome?.tokenId} />
        </div>
        <aside className="md:col-span-1">
          <OrderForm market={market} />
        </aside>
      </div>
    </>
  );
}

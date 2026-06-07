import { getPredictionMarket } from '@/lib/core/catalog';
import { getPrimaryOutcome, type PredictionMarket } from '@/lib/core/market';
import { OrderForm } from '@/components/order-form';
import { NativeSignalForm } from '@/components/native-signal-form';
import { ScalarDistributionForm } from '@/components/scalar-distribution-form';
import { OrderBookView } from '@/components/order-book-view';
import { RiskAcknowledgement } from '@/components/risk-acknowledgement';
import { WorldModelDetail } from '@/components/world-model-detail';
import { getWorldModelBundleByMarket } from '@/lib/providers/credence-native/world-models';
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
  const worldModelBundle =
    market.kind === 'world_model' ? getWorldModelBundleByMarket(market) : null;

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
          {worldModelBundle ? (
            <WorldModelDetail bundle={worldModelBundle} locale={params.locale} />
          ) : market.provider === 'credence' ? (
            <NativeMarketContext market={market} />
          ) : (
            <OrderBookView tokenId={primaryOutcome?.tokenId} />
          )}
        </div>
        <aside className="md:col-span-1">
          {market.provider === 'credence' && market.kind === 'scalar' ? (
            <ScalarDistributionForm market={market} />
          ) : market.provider === 'credence' ? (
            <NativeSignalForm market={market} />
          ) : (
            <OrderForm market={market} />
          )}
        </aside>
      </div>
    </>
  );
}

function NativeMarketContext({ market }: { market: PredictionMarket }) {
  const nativeType = String(market.metadata?.nativeType ?? market.kind);
  const resolutionRule = String(market.metadata?.resolutionRule ?? 'No resolution rule yet.');
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
        CREDENCE NATIVE · {nativeType.toUpperCase()}
      </div>
      <h3 className="text-sm font-medium">SKU Context</h3>
      <div className="mt-3 grid gap-2 text-sm text-fg-muted">
        <div>
          <span className="text-fg-subtle">Provider:</span> {market.provider}
        </div>
        <div>
          <span className="text-fg-subtle">Kind:</span> {market.kind}
        </div>
        <div>
          <span className="text-fg-subtle">Settlement:</span> {market.settlementType}
        </div>
        <div>
          <span className="text-fg-subtle">Trading mode:</span> {market.trading.mode}
        </div>
        <div className="pt-2 text-xs leading-relaxed">
          <span className="text-fg-subtle">Resolution:</span> {resolutionRule}
        </div>
      </div>
    </div>
  );
}

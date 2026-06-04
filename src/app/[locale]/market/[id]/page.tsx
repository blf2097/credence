import { getMarket } from '@/lib/polymarket/gamma';
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
    market = await getMarket(params.id);
  } catch {
    notFound();
  }
  if (!market) notFound();

  const yesPrice = parseFloat(market.outcomePrices?.[0] ?? '0');

  return (
    <>
      <RiskAcknowledgement />
      <div className="mx-auto max-w-5xl px-4 py-8 grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <h1 className="text-2xl font-semibold">{market.question}</h1>
        <div className="flex items-center gap-6 text-sm text-fg-muted">
          <span>YES {formatProb(yesPrice)}</span>
          <span>Vol {formatUSD(market.volume)}</span>
          <span>Liq {formatUSD(market.liquidity)}</span>
          <span>Ends {new Date(market.endDate).toLocaleDateString()}</span>
        </div>
        <p className="text-fg-muted whitespace-pre-line">
          {market.description}
        </p>
        <OrderBookView tokenId={market.clobTokenIds?.[0]} />
      </div>
        <aside className="md:col-span-1">
          <OrderForm market={market} />
        </aside>
      </div>
    </>
  );
}

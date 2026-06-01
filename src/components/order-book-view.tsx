import { getOrderBook } from '@/lib/polymarket/clob';
import { getTranslations } from 'next-intl/server';

export async function OrderBookView({ tokenId }: { tokenId?: string }) {
  const t = await getTranslations('market');
  if (!tokenId) return null;

  let book;
  try {
    book = await getOrderBook(tokenId);
  } catch {
    return null;
  }

  const topAsks = book.asks.slice(0, 5).reverse();
  const topBids = book.bids.slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="text-sm font-medium mb-3">{t('order_book')}</h3>
      <div className="grid grid-cols-2 gap-6 text-sm font-mono">
        <div>
          <div className="text-xs text-fg-subtle mb-1">Asks (Sell)</div>
          {topAsks.map((l, i) => (
            <div key={i} className="flex justify-between text-accent-danger">
              <span>{(parseFloat(l.price) * 100).toFixed(1)}¢</span>
              <span className="text-fg-muted">
                {parseFloat(l.size).toFixed(0)}
              </span>
            </div>
          ))}
          {topAsks.length === 0 && (
            <div className="text-fg-subtle">—</div>
          )}
        </div>
        <div>
          <div className="text-xs text-fg-subtle mb-1">Bids (Buy)</div>
          {topBids.map((l, i) => (
            <div key={i} className="flex justify-between text-accent">
              <span>{(parseFloat(l.price) * 100).toFixed(1)}¢</span>
              <span className="text-fg-muted">
                {parseFloat(l.size).toFixed(0)}
              </span>
            </div>
          ))}
          {topBids.length === 0 && (
            <div className="text-fg-subtle">—</div>
          )}
        </div>
      </div>
    </div>
  );
}

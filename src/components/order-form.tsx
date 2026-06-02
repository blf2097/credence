'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount, useChainId } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { cn, formatProb } from '@/lib/utils';
import type { GammaMarket } from '@/lib/polymarket/types';
import type { CreateOrderResponse, OrderPreview } from '@/lib/polymarket/order';
import { WalletButton } from './wallet-button';
import { usePolymarketCollateral } from '@/hooks/use-polymarket-collateral';

export function OrderForm({ market }: { market: GammaMarket }) {
  const t = useTranslations('market');
  const tWallet = useTranslations('wallet');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState<CreateOrderResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const collateral = usePolymarketCollateral({
    amount,
    negRisk: market.negRisk,
  });

  const yesPrice = parseFloat(market.outcomePrices?.[0] ?? '0.5');
  const noPrice = 1 - yesPrice;
  const price = side === 'YES' ? yesPrice : noPrice;
  const amountNumber = parseFloat(amount || '0');
  const shares = price > 0 ? amountNumber / price : 0;
  const payout = shares * 1; // 1 pUSD per winning share if it resolves
  const isRealTradingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_REAL_TRADING === 'true';

  const buildPreview = (): OrderPreview | null => {
    if (!address) return null;
    return {
      marketId: market.id,
      tokenId: side === 'YES' ? market.clobTokenIds[0] : market.clobTokenIds[1],
      outcome: side,
      side: 'BUY',
      price,
      size: shares,
      collateralAmount: amountNumber,
      trader: address,
      spender: collateral.spender,
      tickSize: market.orderPriceMinTickSize ?? '0.01',
      negRisk: market.negRisk,
    };
  };

  const handleSubmitOrder = async () => {
    const preview = buildPreview();
    if (!preview) return;

    setIsSubmitting(true);
    setResult(null);
    try {
      const validation = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      }).then((res) => res.json() as Promise<CreateOrderResponse>);

      if (validation.status === 'rejected') {
        setResult(validation);
        return;
      }

      if (isRealTradingEnabled) {
        const ok = window.confirm(
          `This will submit a LIVE CLOB order:\n${side} · ${amount} pUSD at ${formatProb(price)}\nShares: ${shares.toFixed(2)}\n\nContinue?`,
        );
        if (!ok) {
          setResult({ status: 'preview', message: 'Live order cancelled.' });
          return;
        }
      }

      const { submitBrowserLimitOrder } = await import(
        '@/lib/polymarket/browser-clob'
      );
      const response = await submitBrowserLimitOrder(preview);
      setResult(response);
    } catch (err) {
      setResult({
        status: 'rejected',
        message: err instanceof Error ? err.message : 'Unknown order error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWrongChain = isConnected && chainId !== polygon.id;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 sticky top-20">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <SideButton
          active={side === 'YES'}
          onClick={() => setSide('YES')}
          tone="up"
        >
          {t('yes')} · {formatProb(yesPrice)}
        </SideButton>
        <SideButton
          active={side === 'NO'}
          onClick={() => setSide('NO')}
          tone="down"
        >
          {t('no')} · {formatProb(noPrice)}
        </SideButton>
      </div>

      <label className="block text-xs text-fg-muted mb-1">
        {t('amount_usd')}
      </label>
      <div className="flex items-center rounded-lg border border-border bg-bg-elevated px-3 py-2">
        <span className="text-fg-muted text-sm mr-1">$</span>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-transparent outline-none text-fg"
        />
        <span className="text-fg-subtle text-xs ml-2">pUSD</span>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <Row label={t('shares')} value={shares.toFixed(2)} />
        <Row label={t('potential_payout')} value={`$${payout.toFixed(2)}`} />
        {isConnected && !isWrongChain ? (
          <>
            <Row
              label={tWallet('balance_usdc')}
              value={`${collateral.balanceFormatted} pUSD`}
            />
            <Row
              label={tWallet('allowance')}
              value={`${collateral.allowanceFormatted} pUSD`}
            />
          </>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {!isConnected || isWrongChain ? (
          <WalletButton className="w-full py-3" />
        ) : isRealTradingEnabled && !collateral.hasEnoughBalance ? (
          <button
            disabled
            className="w-full py-3 rounded-lg bg-bg-elevated text-fg-muted font-medium border border-border cursor-not-allowed"
          >
            {amountNumber > 0
              ? tWallet('insufficient_balance')
              : t('amount_usd')}
          </button>
        ) : isRealTradingEnabled && !collateral.hasEnoughAllowance ? (
          <button
            onClick={collateral.approve}
            disabled={collateral.isApproving || collateral.isLoading}
            className="w-full py-3 rounded-lg bg-accent-gold text-bg font-medium hover:opacity-90 disabled:opacity-40"
          >
            {collateral.isApproving
              ? tWallet('approving')
              : tWallet('approve_usdc')}
          </button>
        ) : (
          <button
            onClick={handleSubmitOrder}
            disabled={!market.acceptingOrders || amountNumber <= 0 || isSubmitting}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition-colors',
              side === 'YES'
                ? 'bg-accent text-bg hover:opacity-90'
                : 'bg-accent-danger text-fg hover:opacity-90',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {isSubmitting
              ? t('submitting_order')
              : isRealTradingEnabled
                ? t('place_order')
                : t('preview_order')}
          </button>
        )}
      </div>

      {result ? (
        <div
          className={cn(
            'mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed',
            result.status === 'submitted'
              ? 'border-accent/50 bg-accent/10 text-accent'
              : result.status === 'rejected'
                ? 'border-accent-danger/50 bg-accent-danger/10 text-accent-danger'
                : 'border-border bg-bg-elevated text-fg-muted',
          )}
        >
          <div>{result.message}</div>
          {result.orderId ? (
            <div className="mt-1 font-mono break-all">{result.orderId}</div>
          ) : null}
        </div>
      ) : null}

      {!isRealTradingEnabled ? (
        <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle">
          Live trading is OFF. This button validates the order path only. Set
          NEXT_PUBLIC_ENABLE_REAL_TRADING=true to enable wallet signing and CLOB
          submission.
        </p>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-accent-gold">
          Live trading is ON. D4 caps each order at 1 pUSD and supports BUY
          limit orders only.
        </p>
      )}
    </div>
  );
}

function SideButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: 'up' | 'down';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg py-2.5 text-sm font-medium border transition-colors',
        active
          ? tone === 'up'
            ? 'bg-accent/15 border-accent text-accent'
            : 'bg-accent-danger/15 border-accent-danger text-accent-danger'
          : 'border-border text-fg-muted hover:border-border-strong',
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

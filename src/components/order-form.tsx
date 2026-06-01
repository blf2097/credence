'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount, useChainId } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { cn, formatProb } from '@/lib/utils';
import type { GammaMarket } from '@/lib/polymarket/types';
import { WalletButton } from './wallet-button';
import { usePolymarketCollateral } from '@/hooks/use-polymarket-collateral';

export function OrderForm({ market }: { market: GammaMarket }) {
  const t = useTranslations('market');
  const tWallet = useTranslations('wallet');
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('10');
  const collateral = usePolymarketCollateral({
    amount,
    negRisk: market.negRisk,
  });

  const yesPrice = parseFloat(market.outcomePrices?.[0] ?? '0.5');
  const noPrice = 1 - yesPrice;
  const price = side === 'YES' ? yesPrice : noPrice;
  const shares = price > 0 ? parseFloat(amount || '0') / price : 0;
  const payout = shares * 1; // 1 USDC per share if it resolves

  const handlePreviewOrder = async () => {
    // D4 task: wire to /api/orders which calls clob.placeOrder.
    // D3 deliberately stops at balance + allowance + deterministic preview.
    alert(
      `[Preview] ${side} · ${amount} pUSD at ${formatProb(price)}\nShares: ${shares.toFixed(2)}\nSpender: ${collateral.spender}`,
    );
  };

  const isWrongChain = isConnected && chainId !== polygon.id;
  const amountNumber = parseFloat(amount || '0');

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
        <span className="text-fg-subtle text-xs ml-2">USDC</span>
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
        ) : !collateral.hasEnoughBalance ? (
          <button
            disabled
            className="w-full py-3 rounded-lg bg-bg-elevated text-fg-muted font-medium border border-border cursor-not-allowed"
          >
            {amountNumber > 0
              ? tWallet('insufficient_balance')
              : t('amount_usd')}
          </button>
        ) : !collateral.hasEnoughAllowance ? (
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
            onClick={handlePreviewOrder}
            disabled={!market.acceptingOrders || amountNumber <= 0}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition-colors',
              side === 'YES'
                ? 'bg-accent text-bg hover:opacity-90'
                : 'bg-accent-danger text-fg hover:opacity-90',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {t('preview_order')}
          </button>
        )}
      </div>
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

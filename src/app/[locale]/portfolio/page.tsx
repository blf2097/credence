'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { WalletButton } from '@/components/wallet-button';
import { cn, formatUSD } from '@/lib/utils';
import type { OpenOrder, Position } from '@/lib/polymarket/portfolio';
import { summarizePositions } from '@/lib/polymarket/portfolio';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [positions, setPositions] = useState<Position[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const summary = useMemo(() => summarizePositions(positions), [positions]);
  const isWrongChain = isConnected && chainId !== polygon.id;

  const loadPositions = useCallback(async () => {
    if (!address) return;
    setLoadingPositions(true);
    setPositionsError(null);
    try {
      const res = await fetch(`/api/positions?user=${address}&limit=100`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load positions');
      setPositions(Array.isArray(data) ? (data as Position[]) : []);
    } catch (err) {
      setPositions([]);
      setPositionsError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingPositions(false);
    }
  }, [address]);

  const loadOpenOrders = useCallback(async () => {
    if (!address || isWrongChain) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const { getBrowserOpenOrders } = await import(
        '@/lib/polymarket/browser-clob'
      );
      setOpenOrders(await getBrowserOpenOrders(address));
    } catch (err) {
      setOpenOrders([]);
      setOrdersError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingOrders(false);
    }
  }, [address, isWrongChain]);

  useEffect(() => {
    if (!address) return;
    void loadPositions();
  }, [address, loadPositions]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold mb-6">Portfolio</h1>
        <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center">
          <p className="text-fg-muted mb-4">连接钱包以查看持仓和挂单</p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio</h1>
          <div className="mt-1 text-sm text-fg-muted font-mono break-all">
            {address}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WalletButton />
          <button
            onClick={() => {
              void loadPositions();
              void loadOpenOrders();
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:border-border-strong"
          >
            Refresh
          </button>
        </div>
      </div>

      {isWrongChain ? (
        <div className="rounded-xl border border-accent-gold/40 bg-accent-gold/10 p-4 text-sm text-accent-gold">
          请先切换到 Polygon 主网，才能读取 CLOB 挂单。
        </div>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Positions" value={summary.openPositions.toString()} />
        <StatCard label="Current value" value={formatUSD(summary.positionsValue)} />
        <StatCard label="Initial value" value={formatUSD(summary.initialValue)} />
        <StatCard
          label="Cash PnL"
          value={formatUSD(summary.cashPnl)}
          tone={summary.cashPnl >= 0 ? 'up' : 'down'}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-medium">Current positions</h2>
            <span className="text-xs text-fg-subtle">
              {loadingPositions ? 'Loading…' : `${positions.length} rows`}
            </span>
          </div>
          {positionsError ? (
            <ErrorBox message={positionsError} />
          ) : positions.length ? (
            <div className="divide-y divide-border">
              {positions.map((position) => (
                <PositionRow key={`${position.conditionId}-${position.asset}`} position={position} />
              ))}
            </div>
          ) : (
            <EmptyBox text="这个钱包暂无公开持仓。" />
          )}
        </div>

        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-medium">Open orders</h2>
            <button
              onClick={() => void loadOpenOrders()}
              disabled={loadingOrders || isWrongChain}
              className="text-xs text-fg-muted hover:text-fg disabled:opacity-40"
            >
              {loadingOrders ? 'Loading…' : 'Load'}
            </button>
          </div>
          {ordersError ? (
            <ErrorBox message={ordersError} />
          ) : openOrders.length ? (
            <div className="divide-y divide-border">
              {openOrders.map((order) => (
                <OpenOrderRow key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <EmptyBox text="点击 Load 读取 CLOB 当前挂单。首次读取可能需要钱包签名派生 API key。" />
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'up' | 'down';
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div
        className={cn(
          'mt-1 text-2xl font-semibold',
          tone === 'up' && 'text-accent',
          tone === 'down' && 'text-accent-danger',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PositionRow({ position }: { position: Position }) {
  return (
    <div className="p-4 flex gap-3">
      {position.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={position.icon} alt="" className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-bg-elevated" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium line-clamp-2">{position.title}</div>
        <div className="mt-1 text-xs text-fg-muted">
          {position.outcome} · {position.size.toFixed(2)} shares · avg{' '}
          {(position.avgPrice * 100).toFixed(1)}¢ · cur{' '}
          {(position.curPrice * 100).toFixed(1)}¢
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-mono">{formatUSD(position.currentValue)}</div>
        <div
          className={cn(
            'text-xs font-mono',
            position.cashPnl >= 0 ? 'text-accent' : 'text-accent-danger',
          )}
        >
          {formatUSD(position.cashPnl)}
        </div>
      </div>
    </div>
  );
}

function OpenOrderRow({ order }: { order: OpenOrder }) {
  const remaining = Math.max(
    Number(order.original_size || 0) - Number(order.size_matched || 0),
    0,
  );
  return (
    <div className="p-4 text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'font-semibold',
            order.side === 'BUY' ? 'text-accent' : 'text-accent-danger',
          )}
        >
          {order.side} {order.outcome}
        </span>
        <span className="font-mono">{(Number(order.price) * 100).toFixed(1)}¢</span>
      </div>
      <div className="text-xs text-fg-muted">
        remaining {remaining.toFixed(2)} · {order.order_type}
      </div>
      <div className="text-[10px] text-fg-subtle font-mono break-all">{order.id}</div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return <div className="p-6 text-sm text-fg-muted leading-relaxed">{text}</div>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="m-4 rounded-lg border border-accent-danger/50 bg-accent-danger/10 p-3 text-sm text-accent-danger">
      {message}
    </div>
  );
}

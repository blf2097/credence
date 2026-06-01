'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Portfolio</h1>
      {!isConnected ? (
        <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center">
          <p className="text-fg-muted mb-4">连接钱包以查看持仓</p>
          <ConnectButton />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-elevated p-6">
          <div className="text-sm text-fg-muted">Address</div>
          <div className="font-mono text-sm break-all">{address}</div>
          <div className="mt-6 text-fg-subtle text-sm">
            持仓视图将在 D5 接入（CLOB /positions API）。
          </div>
        </div>
      )}
    </div>
  );
}

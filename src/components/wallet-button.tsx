'use client';

import { useTranslations } from 'next-intl';
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { polygon } from 'wagmi/chains';
import { cn } from '@/lib/utils';

export function WalletButton({ className }: { className?: string }) {
  const t = useTranslations('wallet');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const injectedConnector = connectors[0];
  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  if (!isConnected) {
    return (
      <button
        className={cn(
          'rounded-lg bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50',
          className,
        )}
        disabled={!injectedConnector || isConnecting}
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      >
        {isConnecting ? t('connecting') : t('connect')}
      </button>
    );
  }

  if (chainId !== polygon.id) {
    return (
      <button
        className={cn(
          'rounded-lg bg-accent-gold px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50',
          className,
        )}
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: polygon.id })}
      >
        {isSwitching ? t('switching') : t('switch_network')}
      </button>
    );
  }

  return (
    <button
      className={cn(
        'rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg hover:border-border-strong',
        className,
      )}
      onClick={() => disconnect()}
      title={t('disconnect')}
    >
      {shortAddress}
    </button>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { getErrorMessage } from '@/lib/errors';

export function WalletButton({ className }: { className?: string }) {
  const t = useTranslations('wallet');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [hasInjectedWallet, setHasInjectedWallet] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = () => {
      setHasInjectedWallet(Boolean(window.ethereum));
    };

    checkWallet();
    window.addEventListener('ethereum#initialized', checkWallet, {
      once: true,
    });
    const timer = window.setTimeout(checkWallet, 500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('ethereum#initialized', checkWallet);
    };
  }, []);

  const injectedConnector = useMemo(
    () => connectors.find((connector) => connector.type === 'injected') ?? connectors[0],
    [connectors],
  );
  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  const handleConnect = async () => {
    setError(null);
    if (!hasInjectedWallet) {
      setError(t('no_injected_wallet'));
      return;
    }
    if (!injectedConnector) {
      setError(t('connector_unavailable'));
      return;
    }

    try {
      await connectAsync({ connector: injectedConnector });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSwitchChain = async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: polygon.id });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDisconnect = () => {
    setError(null);
    disconnect();
  };

  if (!isConnected) {
    return (
      <WalletButtonShell error={error}>
        <button
          className={cn(
            'rounded-lg bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50',
            className,
          )}
          disabled={hasInjectedWallet === null || isConnecting}
          onClick={handleConnect}
          title={hasInjectedWallet === false ? t('no_injected_wallet') : undefined}
        >
          {isConnecting
            ? t('connecting')
            : hasInjectedWallet === false
              ? t('install_wallet')
              : t('connect')}
        </button>
      </WalletButtonShell>
    );
  }

  if (chainId !== polygon.id) {
    return (
      <WalletButtonShell error={error}>
        <button
          className={cn(
            'rounded-lg bg-accent-gold px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50',
            className,
          )}
          disabled={isSwitching}
          onClick={handleSwitchChain}
        >
          {isSwitching ? t('switching') : t('switch_network')}
        </button>
      </WalletButtonShell>
    );
  }

  return (
    <WalletButtonShell error={error}>
      <button
        className={cn(
          'rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg hover:border-border-strong',
          className,
        )}
        onClick={handleDisconnect}
        title={t('disconnect')}
      >
        {shortAddress}
      </button>
    </WalletButtonShell>
  );
}

function WalletButtonShell({
  children,
  error,
}: {
  children: React.ReactNode;
  error: string | null;
}) {
  return (
    <div className="relative inline-flex flex-col items-stretch gap-1">
      {children}
      {error ? (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-accent-danger/50 bg-bg-card p-2 text-xs leading-relaxed text-accent-danger shadow-xl z-50">
          {error}
        </div>
      ) : null}
    </div>
  );
}

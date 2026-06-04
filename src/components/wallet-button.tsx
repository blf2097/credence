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

const WALLET_CONNECT_PENDING_EVENT = 'credence:wallet-connect-pending';
const CONNECT_PENDING_STALE_MS = 8_000;
let globalConnectPending = false;
let globalConnectPendingStartedAt = 0;

function isGlobalConnectPendingActive() {
  return (
    globalConnectPending &&
    Date.now() - globalConnectPendingStartedAt < CONNECT_PENDING_STALE_MS
  );
}

function setGlobalConnectPending(value: boolean) {
  globalConnectPending = value;
  globalConnectPendingStartedAt = value ? Date.now() : 0;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(WALLET_CONNECT_PENDING_EVENT));
  }
}

function isWalletRequestPendingError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('wallet_requestpermissions') ||
    message.includes('already pending') ||
    message.includes('-32002')
  );
}

function isUnsupportedMethodError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('unsupported') ||
    message.includes('method not found') ||
    message.includes('-32601')
  );
}

function clearWagmiWalletStorage() {
  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith('wagmi.')) window.localStorage.removeItem(key);
  }
}

export function WalletButton({ className }: { className?: string }) {
  const t = useTranslations('wallet');
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [hasInjectedWallet, setHasInjectedWallet] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [globalPending, setGlobalPending] = useState(
    isGlobalConnectPendingActive(),
  );

  useEffect(() => {
    const checkWallet = () => {
      setHasInjectedWallet(Boolean(window.ethereum));
    };
    const syncGlobalPending = () => {
      const active = isGlobalConnectPendingActive();
      setGlobalPending(active);
      if (!active && globalConnectPending) {
        setGlobalConnectPending(false);
      }
    };

    checkWallet();
    syncGlobalPending();
    window.addEventListener('ethereum#initialized', checkWallet, {
      once: true,
    });
    window.addEventListener(WALLET_CONNECT_PENDING_EVENT, syncGlobalPending);
    const walletTimer = window.setTimeout(checkWallet, 500);
    const pendingTimer = window.setInterval(syncGlobalPending, 1_000);

    return () => {
      window.clearTimeout(walletTimer);
      window.clearInterval(pendingTimer);
      window.removeEventListener('ethereum#initialized', checkWallet);
      window.removeEventListener(WALLET_CONNECT_PENDING_EVENT, syncGlobalPending);
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
    if (isGlobalConnectPendingActive()) {
      setError(t('request_pending'));
      return;
    }

    if (globalConnectPending) {
      setGlobalConnectPending(false);
    }

    setGlobalConnectPending(true);
    try {
      await connectAsync({ connector: injectedConnector });
    } catch (err) {
      setError(isWalletRequestPendingError(err) ? t('request_pending') : getErrorMessage(err));
    } finally {
      setGlobalConnectPending(false);
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

  const handleResetConnection = async () => {
    setGlobalConnectPending(false);
    setError(null);
    disconnect();
    clearWagmiWalletStorage();

    try {
      await window.ethereum?.request?.({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (err) {
      // Revocation is best-effort. Some wallets do not support it, and it
      // cannot cancel an already-open wallet permission popup.
      if (!isUnsupportedMethodError(err) && !isWalletRequestPendingError(err)) {
        setError(getErrorMessage(err));
        return;
      }
    }

    setError(t('connection_reset'));
  };

  const handleDisconnect = () => {
    setError(null);
    setGlobalConnectPending(false);
    disconnect();
  };

  if (!isConnected) {
    return (
      <WalletButtonShell
        error={error}
        showReset={Boolean(error)}
        onReset={handleResetConnection}
        resetLabel={t('reset_connection')}
      >
        <button
          className={cn(
            'rounded-lg bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50',
            className,
          )}
          disabled={hasInjectedWallet === null || isConnecting || globalPending}
          onClick={handleConnect}
          title={hasInjectedWallet === false ? t('no_injected_wallet') : undefined}
        >
          {isConnecting || globalPending
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
      <WalletButtonShell
        error={error}
        showReset={Boolean(error)}
        onReset={handleResetConnection}
        resetLabel={t('reset_connection')}
      >
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
  showReset = false,
  onReset,
  resetLabel,
}: {
  children: React.ReactNode;
  error: string | null;
  showReset?: boolean;
  onReset?: () => void;
  resetLabel?: string;
}) {
  return (
    <div className="relative inline-flex flex-col items-stretch gap-1">
      {children}
      {error ? (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-accent-danger/50 bg-bg-card p-2 text-xs leading-relaxed text-accent-danger shadow-xl z-50">
          <div>{error}</div>
          {showReset && onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="mt-2 rounded border border-border px-2 py-1 text-fg-muted hover:text-fg"
            >
              {resetLabel ?? 'Reset connection state'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

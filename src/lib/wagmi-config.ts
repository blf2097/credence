import { http } from 'viem';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { polygon } from 'wagmi/chains';

const POLYGON_RPC =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? 'https://polygon-rpc.com';

/**
 * D3 note:
 * Keep the connector surface intentionally small: injected wallets only
 * (MetaMask/Rabby/OKX Wallet). WalletConnect QR will be reintroduced later
 * through a no-SSR boundary if user demand justifies the extra bundle/SSR risk.
 */
export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [polygon.id]: http(POLYGON_RPC),
  },
  ssr: true,
});

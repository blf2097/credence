import { http } from 'viem';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { polygon } from 'wagmi/chains';

const POLYGON_RPC =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? 'https://polygon-rpc.com';

/**
 * D2 note:
 * RainbowKit's getDefaultConfig eagerly initializes WalletConnect storage,
 * which touches indexedDB during Next.js prerender and pollutes builds.
 * For now we use the injected connector only (MetaMask/Rabby/OKX Wallet).
 * WalletConnect QR can be re-enabled in D3 behind a no-SSR boundary.
 */
export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [injected()],
  transports: {
    [polygon.id]: http(POLYGON_RPC),
  },
  ssr: true,
});

// USDC.e on Polygon — used by Polymarket CLOB
export const USDC_E_POLYGON =
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const;

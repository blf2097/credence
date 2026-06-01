import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon } from 'wagmi/chains';
import { http } from 'viem';

const POLYGON_RPC =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? 'https://polygon-rpc.com';

const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'dev-placeholder';

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Credence',
  projectId: WC_PROJECT_ID,
  chains: [polygon],
  transports: {
    [polygon.id]: http(POLYGON_RPC),
  },
  ssr: true,
});

// USDC.e on Polygon — used by Polymarket CLOB
export const USDC_E_POLYGON =
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const;

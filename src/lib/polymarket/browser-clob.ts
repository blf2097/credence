'use client';

import { ethers } from 'ethers';
import {
  Chain,
  ClobClient,
  OrderType,
  Side,
  type ApiKeyCreds,
  type TickSize,
} from '@polymarket/clob-client';
import { getErrorMessage } from '@/lib/errors';
import type { CreateOrderResponse, OrderPreview } from './order';
import type { OpenOrder } from './portfolio';

const CLOB_HOST =
  process.env.NEXT_PUBLIC_POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';

const REAL_TRADING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_REAL_TRADING === 'true';

const POLYGON_CHAIN_HEX = '0x89';
const MAX_D4_COLLATERAL = 1;

type InjectedProvider = ethers.providers.ExternalProvider & {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export async function getBrowserOpenOrders(address: string): Promise<OpenOrder[]> {
  try {
    const client = await getAuthenticatedBrowserClient(address);
    const response = await client.getOpenOrders();
    if (Array.isArray(response)) return response as OpenOrder[];

    const record = response as { data?: unknown } | undefined;
    return Array.isArray(record?.data) ? (record.data as OpenOrder[]) : [];
  } catch (err) {
    throw new Error(`CLOB open orders failed: ${getErrorMessage(err)}`);
  }
}

export async function submitBrowserLimitOrder(
  preview: OrderPreview,
): Promise<CreateOrderResponse> {
  if (!REAL_TRADING_ENABLED) {
    return {
      status: 'disabled',
      message:
        'Real trading is disabled. Set NEXT_PUBLIC_ENABLE_REAL_TRADING=true to submit live CLOB orders.',
    };
  }

  if (preview.side !== 'BUY') {
    return {
      status: 'rejected',
      message: 'D4 supports BUY limit orders only.',
    };
  }

  if (preview.collateralAmount > MAX_D4_COLLATERAL) {
    return {
      status: 'rejected',
      message: `D4 safety cap: max ${MAX_D4_COLLATERAL} pUSD per live order.`,
    };
  }

  if (!window.ethereum) {
    return {
      status: 'rejected',
      message: 'No injected wallet found. Install MetaMask/Rabby/OKX Wallet.',
    };
  }

  const client = await getAuthenticatedBrowserClient(preview.trader);

  const response = await client.createAndPostOrder(
    {
      tokenID: preview.tokenId,
      price: preview.price,
      size: preview.size,
      side: Side.BUY,
    },
    {
      tickSize: normalizeTickSize(preview.tickSize),
      negRisk: Boolean(preview.negRisk),
    },
    OrderType.GTC,
  );

  return normalizeClobResponse(response);
}

async function getAuthenticatedBrowserClient(address: string): Promise<ClobClient> {
  const ethereum = getInjectedProvider();
  await ensurePolygonNetwork(ethereum);

  const provider = new ethers.providers.Web3Provider(ethereum, 'any');
  const activeNetwork = await provider.getNetwork();
  if (activeNetwork.chainId !== Chain.POLYGON) {
    throw new Error(
      `Wallet is still on chain ${activeNetwork.chainId}. Please switch to Polygon and retry.`,
    );
  }

  const signer = provider.getSigner();
  const signerAddress = await signer.getAddress();

  if (signerAddress.toLowerCase() !== address.toLowerCase()) {
    throw new Error('Connected wallet changed. Refresh and retry.');
  }

  const bootstrapClient = new ClobClient(CLOB_HOST, Chain.POLYGON, signer);
  const creds = await getOrCreateApiCreds(address, bootstrapClient);
  return new ClobClient(CLOB_HOST, Chain.POLYGON, signer, creds);
}

function getInjectedProvider(): InjectedProvider {
  const ethereum = window.ethereum as InjectedProvider | undefined;
  if (!ethereum?.request) {
    throw new Error('No injected wallet found. Install MetaMask/Rabby/OKX Wallet.');
  }
  return ethereum;
}

async function ensurePolygonNetwork(ethereum: InjectedProvider) {
  const chainId = await ethereum.request?.({ method: 'eth_chainId' });
  if (chainId === POLYGON_CHAIN_HEX) return;

  try {
    await ethereum.request?.({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_HEX }],
    });
  } catch (err) {
    const record = err as { code?: number; message?: string };
    if (record.code === 4902) {
      await ethereum.request?.({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: POLYGON_CHAIN_HEX,
            chainName: 'Polygon Mainnet',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          },
        ],
      });
    } else if (record.code === 4001) {
      throw new Error('Wallet network switch rejected. Please switch to Polygon mainnet and retry.');
    } else {
      throw new Error(`Wallet network switch failed: ${getErrorMessage(err)}`);
    }
  }

  const nextChainId = await ethereum.request?.({ method: 'eth_chainId' });
  if (nextChainId !== POLYGON_CHAIN_HEX) {
    throw new Error('Wallet is not on Polygon mainnet after switch. Please retry after the wallet finishes switching.');
  }
}

async function getOrCreateApiCreds(
  address: string,
  client: ClobClient,
): Promise<ApiKeyCreds> {
  const key = `credence:clob-api-creds:${address.toLowerCase()}`;
  const existing = window.localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing) as ApiKeyCreds;
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  const creds = await client.createOrDeriveApiKey();
  window.localStorage.setItem(key, JSON.stringify(creds));
  return creds;
}

function normalizeTickSize(value?: string): TickSize {
  if (value === '0.1' || value === '0.01' || value === '0.001' || value === '0.0001') {
    return value;
  }
  return '0.01';
}

function normalizeClobResponse(response: unknown): CreateOrderResponse {
  const record = response as Partial<{
    success: boolean;
    errorMsg: string;
    orderID: string;
    orderId: string;
    status: string;
  }>;

  if (record.success === false) {
    return {
      status: 'rejected',
      message: record.errorMsg || 'CLOB rejected the order.',
      raw: response,
    };
  }

  return {
    status: 'submitted',
    orderId: record.orderID ?? record.orderId,
    message: record.status
      ? `CLOB order ${record.status}.`
      : 'CLOB order submitted.',
    raw: response,
  };
}

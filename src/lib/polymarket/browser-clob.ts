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
import type { CreateOrderResponse, OrderPreview } from './order';

const CLOB_HOST =
  process.env.NEXT_PUBLIC_POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';

const REAL_TRADING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_REAL_TRADING === 'true';

const MAX_D4_COLLATERAL = 1;


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

  const signer = new ethers.providers.Web3Provider(
    window.ethereum,
    'any',
  ).getSigner();
  const signerAddress = await signer.getAddress();

  if (signerAddress.toLowerCase() !== preview.trader.toLowerCase()) {
    return {
      status: 'rejected',
      message: 'Connected wallet changed. Refresh and retry.',
    };
  }

  const bootstrapClient = new ClobClient(CLOB_HOST, Chain.POLYGON, signer);
  const creds = await getOrCreateApiCreds(preview.trader, bootstrapClient);
  const client = new ClobClient(
    CLOB_HOST,
    Chain.POLYGON,
    signer,
    creds,
  );

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

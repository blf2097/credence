/**
 * CLOB API wrapper — order book reads + signed order placement.
 *
 * Uses @polymarket/clob-client (official SDK).
 * Docs: https://docs.polymarket.com/#clob-api
 *
 * Auth model:
 *   - L1 (private key) — derives EOA address
 *   - L2 (API key/secret/passphrase) — derived once via deriveApiKey(),
 *     then cached server-side. Never expose to the browser.
 *
 * D2 task: implement real getOrderBook + postOrder.
 * D3 task: handle USDC.e approval flow on Polygon.
 *
 * For the MVP we keep this server-only (route handlers / server actions).
 * Browser code talks to /api/* in our app, never directly to CLOB.
 */

import type { OrderBook, PlaceOrderInput } from './types';

const CLOB_BASE =
  process.env.NEXT_PUBLIC_POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';

/**
 * Public read — fetch the live order book for a token.
 * No auth needed for reads.
 */
export async function getOrderBook(tokenId: string): Promise<OrderBook> {
  const res = await fetch(`${CLOB_BASE}/book?token_id=${tokenId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CLOB getOrderBook failed: ${res.status}`);
  const raw = (await res.json()) as {
    market: string;
    asks: { price: string; size: string }[];
    bids: { price: string; size: string }[];
    timestamp: string | number;
  };
  return {
    marketId: raw.market,
    asks: raw.asks,
    bids: raw.bids,
    timestamp:
      typeof raw.timestamp === 'number'
        ? raw.timestamp
        : Number.parseInt(raw.timestamp, 10),
  };
}

/**
 * Place a signed order via CLOB.
 *
 * Server-side only — needs L1 private key + L2 derived API creds.
 * Implementation in D3 once @polymarket/clob-client is integrated.
 */
export async function placeOrder(_input: PlaceOrderInput): Promise<{
  orderId: string;
  status: string;
}> {
  throw new Error(
    '[clob.placeOrder] not implemented — wired in D3. ' +
      'Will use ClobClient.postOrder with EIP-712 signing.',
  );
}

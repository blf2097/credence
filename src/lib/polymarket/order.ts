import type { Address } from 'viem';
import type { OrderSide } from './types';

export interface OrderPreview {
  marketId: string;
  tokenId: string;
  outcome: 'YES' | 'NO';
  side: OrderSide;
  price: number;
  size: number;
  collateralAmount: number;
  trader: Address;
  spender: Address;
  tickSize?: string;
  negRisk?: boolean;
}

export interface CreateOrderRequest extends OrderPreview {
  // D4/D5: populated by a browser wallet signature flow or a server-side
  // delegated signing flow. We intentionally do not accept raw private keys.
  signature?: string;
}

export interface CreateOrderResponse {
  orderId?: string;
  status:
    | 'preview'
    | 'signed'
    | 'submitted'
    | 'rejected'
    | 'not_implemented'
    | 'disabled';
  message: string;
  raw?: unknown;
}

export function validateOrderPreview(input: Partial<OrderPreview>): string[] {
  const errors: string[] = [];
  if (!input.marketId) errors.push('marketId is required');
  if (!input.tokenId) errors.push('tokenId is required');
  if (!input.trader) errors.push('trader is required');
  if (!input.spender) errors.push('spender is required');
  if (input.price === undefined || input.price <= 0 || input.price >= 1) {
    errors.push('price must be between 0 and 1');
  }
  if (input.size === undefined || input.size <= 0) {
    errors.push('size must be greater than 0');
  }
  if (input.collateralAmount === undefined || input.collateralAmount <= 0) {
    errors.push('collateralAmount must be greater than 0');
  }
  return errors;
}

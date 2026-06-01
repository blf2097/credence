import { NextRequest, NextResponse } from 'next/server';
import type { CreateOrderRequest, CreateOrderResponse } from '@/lib/polymarket/order';
import { validateOrderPreview } from '@/lib/polymarket/order';

/**
 * D3 guardrail endpoint.
 *
 * This route deliberately does NOT place orders yet. It validates the shape of
 * an order preview and returns 501 until D4 implements the CLOB signing flow.
 *
 * Why so strict? Polymarket CLOB orders require EIP-712 order signing + L2 API
 * credentials. We never accept raw private keys through the browser/API.
 */
export async function POST(req: NextRequest) {
  let payload: Partial<CreateOrderRequest>;
  try {
    payload = (await req.json()) as Partial<CreateOrderRequest>;
  } catch {
    return NextResponse.json<CreateOrderResponse>(
      {
        status: 'rejected',
        message: 'Invalid JSON body',
      },
      { status: 400 },
    );
  }

  const errors = validateOrderPreview(payload);
  if (errors.length) {
    return NextResponse.json<CreateOrderResponse>(
      {
        status: 'rejected',
        message: errors.join('; '),
      },
      { status: 400 },
    );
  }

  return NextResponse.json<CreateOrderResponse>(
    {
      status: 'not_implemented',
      message:
        'Order validation passed, but CLOB signing/submission is intentionally disabled until D4.',
    },
    { status: 501 },
  );
}

import { NextRequest, NextResponse } from 'next/server';
import type { CreateOrderRequest, CreateOrderResponse } from '@/lib/polymarket/order';
import { validateOrderPreview } from '@/lib/polymarket/order';

/**
 * D4 order preview validator.
 *
 * Real CLOB signing/submission runs in the browser through the user's injected
 * wallet (see `browser-clob.ts`) because we never accept raw private keys and
 * never store user L2 API secrets server-side in the MVP. This endpoint remains
 * a server-side shape/risk validator for previews and future audit logging.
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

  return NextResponse.json<CreateOrderResponse>({
    status: 'preview',
    message:
      'Order preview validated. Browser wallet signing may continue if live trading is enabled.',
  });
}

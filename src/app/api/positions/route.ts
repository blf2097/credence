import { NextRequest, NextResponse } from 'next/server';
import type { Position } from '@/lib/polymarket/portfolio';

const DATA_API_BASE = 'https://data-api.polymarket.com';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('user') ?? '';
  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: 'Invalid user address' }, { status: 400 });
  }

  const url = new URL(`${DATA_API_BASE}/positions`);
  url.searchParams.set('user', address);
  url.searchParams.set('limit', req.nextUrl.searchParams.get('limit') ?? '100');
  url.searchParams.set('offset', req.nextUrl.searchParams.get('offset') ?? '0');
  url.searchParams.set('sizeThreshold', req.nextUrl.searchParams.get('sizeThreshold') ?? '0');
  url.searchParams.set('sortBy', req.nextUrl.searchParams.get('sortBy') ?? 'CURRENT');
  url.searchParams.set(
    'sortDirection',
    req.nextUrl.searchParams.get('sortDirection') ?? 'DESC',
  );

  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Polymarket positions failed: ${res.status}`, detail: text },
        { status: res.status },
      );
    }

    const data = (await res.json()) as Position[];
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Polymarket positions request failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}

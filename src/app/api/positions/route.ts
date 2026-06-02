import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage, readJsonOrText } from '@/lib/errors';
import { buildPositionsUrl, normalizePositionsPayload } from '@/lib/polymarket/data-api';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const POSITIONS_TIMEOUT_MS = 8_000;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('user') ?? '';
  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: 'Invalid user address' }, { status: 400 });
  }

  const url = buildPositionsUrl({
    user: address,
    limit: Number(req.nextUrl.searchParams.get('limit') ?? 100),
    offset: Number(req.nextUrl.searchParams.get('offset') ?? 0),
    sizeThreshold: Number(req.nextUrl.searchParams.get('sizeThreshold') ?? 0),
    sortBy: req.nextUrl.searchParams.get('sortBy') ?? 'CURRENT',
    sortDirection:
      req.nextUrl.searchParams.get('sortDirection') === 'ASC' ? 'ASC' : 'DESC',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POSITIONS_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        'user-agent': 'Credence-MVP/0.1',
      },
    });

    const payload = await readJsonOrText(res);
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Polymarket Data API returned ${res.status}`,
          detail: getErrorMessage(payload),
          upstream: url.toString(),
        },
        { status: res.status },
      );
    }

    return NextResponse.json(normalizePositionsPayload(payload));
  } catch (err) {
    const message = getErrorMessage(err);
    return NextResponse.json(
      {
        error: 'Polymarket Data API is unreachable from the local server',
        detail:
          message === 'This operation was aborted'
            ? `Request timed out after ${POSITIONS_TIMEOUT_MS / 1000}s`
            : message,
        upstream: url.toString(),
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

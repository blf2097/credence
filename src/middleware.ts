import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

// D6: enable real geo-blocking via Cloudflare's CF-IPCountry header.
// In dev (no CF), GEO_BLOCK_COUNTRIES is ignored.
const blockedCountries = (process.env.GEO_BLOCK_COUNTRIES ?? '')
  .split(',')
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

export default function middleware(req: NextRequest) {
  const country = req.headers.get('cf-ipcountry')?.toUpperCase() ?? '';
  if (country && blockedCountries.includes(country)) {
    return new NextResponse('Service not available in your region.', {
      status: 451,
    });
  }
  return intlMiddleware(req);
}

export const config = {
  // Match all paths except API, static files, and Next internals
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

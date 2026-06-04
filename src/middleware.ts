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
  const pathname = req.nextUrl.pathname;

  if (country && blockedCountries.includes(country) && !isBlockedPage(pathname)) {
    const locale = getPathLocale(pathname);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/blocked`;
    url.searchParams.set('country', country);
    return NextResponse.redirect(url, { status: 307 });
  }

  return intlMiddleware(req);
}

function getPathLocale(pathname: string) {
  const maybeLocale = pathname.split('/')[1];
  return locales.includes(maybeLocale as (typeof locales)[number])
    ? maybeLocale
    : defaultLocale;
}

function isBlockedPage(pathname: string) {
  return pathname === '/blocked' || pathname.endsWith('/blocked');
}

export const config = {
  // Match all paths except API, static files, and Next internals
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

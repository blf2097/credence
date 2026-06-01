'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent grid place-items-center font-bold text-bg">
            C
          </div>
          <span className="font-semibold tracking-tight">
            {tBrand('name')}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-fg-muted">
          <Link href={`/${locale}`} className="hover:text-fg">
            {t('markets')}
          </Link>
          <Link href={`/${locale}/portfolio`} className="hover:text-fg">
            {t('portfolio')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}

function LocaleSwitcher({ current }: { current: string }) {
  const next = current === 'zh' ? 'en' : 'zh';
  return (
    <Link
      href={`/${next}`}
      className="text-xs text-fg-muted hover:text-fg border border-border rounded px-2 py-1"
    >
      {next.toUpperCase()}
    </Link>
  );
}

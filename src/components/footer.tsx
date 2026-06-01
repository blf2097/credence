'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-fg-muted">
        <span>{t('powered_by')}</span>
        <nav className="flex gap-6">
          <Link href={`/${locale}/legal/terms`}>{t('terms')}</Link>
          <Link href={`/${locale}/legal/risk`}>{t('risk')}</Link>
          <a href="mailto:hello@credence.gg">{t('contact')}</a>
        </nav>
      </div>
    </footer>
  );
}

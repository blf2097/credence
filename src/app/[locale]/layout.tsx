import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Providers } from '../providers';
import { locales } from '@/i18n';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Credence — 押注真相，而不是赔率',
  description:
    '东南亚加密用户的本地化预测市场入口。Polymarket 原生流动性，零额外加价。',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://credence.gg',
  ),
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  unstable_setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen flex flex-col bg-bg text-fg">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

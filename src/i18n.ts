import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales — D11 will add 'vi' (Vietnamese) and 'id' (Indonesian)
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

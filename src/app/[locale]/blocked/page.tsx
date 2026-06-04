import { unstable_setRequestLocale } from 'next-intl/server';

export default function BlockedPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-2xl px-4 py-20">
      <div className="rounded-2xl border border-border bg-bg-card p-8">
        <div className="text-sm font-mono text-accent-gold">451</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Service unavailable in your region
        </h1>
        <p className="mt-4 text-fg-muted leading-relaxed">
          Credence is a non-custodial prediction market frontend. Access is not
          available from certain jurisdictions because of legal, regulatory, or
          platform-policy restrictions.
        </p>
        <p className="mt-3 text-sm text-fg-subtle leading-relaxed">
          If you believe this is a mistake, disconnect any VPN/proxy and reload.
          Do not attempt to bypass regional restrictions if your local law does
          not permit this activity.
        </p>
      </div>
    </main>
  );
}

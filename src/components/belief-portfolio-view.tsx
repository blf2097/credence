'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  getBeliefPortfolio,
  type BeliefItem,
  type BeliefPortfolio,
} from '@/lib/providers/credence-native/belief-portfolio';
import { cn } from '@/lib/utils';

const KIND_LABELS: Record<string, string> = {
  binary: '事件型',
  scalar: '变量型',
  world_model: '世界模型',
  categorical: '多选型',
  signal: '信念',
};

export function BeliefPortfolioView() {
  const locale = useLocale();
  const [portfolio, setPortfolio] = useState<BeliefPortfolio | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void getBeliefPortfolio().then((data) => {
      if (active) {
        setPortfolio(data);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-fg-muted">
        正在加载你的信念组合…
      </div>
    );
  }

  const items = portfolio?.items ?? [];
  const summary = portfolio?.summary;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <PageHeading />
        <div className="rounded-xl border border-border bg-bg-card p-10 text-center">
          <div className="text-lg font-medium mb-2">你还没有持有任何信念</div>
          <p className="text-sm text-fg-muted leading-relaxed mb-6">
            信念组合记录你对未来的判断——不是单次下注，而是一组可以被持续校准的立场。
            <br />
            去市场页提交你的第一个判断：选择结果、给出置信度、写下理由。
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            浏览市场
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <PageHeading />

      {summary ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="持有信念" value={summary.total.toString()} />
          <SummaryCard
            label="平均置信度"
            value={`${summary.averageConfidence}%`}
          />
          <SummaryCard label="信念型" value={summary.signalCount.toString()} />
          <SummaryCard label="分布预测" value={summary.scalarCount.toString()} />
        </section>
      ) : null}

      {summary?.strongest && summary.total > 1 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConvictionCard
            tone="strong"
            label="最强信念"
            item={summary.strongest}
            locale={locale}
          />
          {summary.weakest && summary.weakest.id !== summary.strongest.id ? (
            <ConvictionCard
              tone="weak"
              label="最不确定"
              item={summary.weakest}
              locale={locale}
            />
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-medium text-fg-muted mb-3">
          全部信念（{items.length}）
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <BeliefRow key={item.id} item={item} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PageHeading() {
  return (
    <div className="mb-2">
      <h1 className="text-2xl font-semibold">信念组合</h1>
      <p className="mt-1 text-sm text-fg-muted">
        你对未来持有的全部判断，按提交时间排列。每一条都可以随新证据被校准。
      </p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ConvictionCard({
  tone,
  label,
  item,
  locale,
}: {
  tone: 'strong' | 'weak';
  label: string;
  item: BeliefItem;
  locale: string;
}) {
  return (
    <Link
      href={`/${locale}/market/${item.marketId.replace(/^credence:/, '')}`}
      className={cn(
        'block rounded-xl border p-4 transition-colors',
        tone === 'strong'
          ? 'border-accent/40 bg-accent/5 hover:border-accent'
          : 'border-accent-gold/40 bg-accent-gold/5 hover:border-accent-gold',
      )}
    >
      <div
        className={cn(
          'text-xs font-medium mb-1',
          tone === 'strong' ? 'text-accent' : 'text-accent-gold',
        )}
      >
        {label} · {item.confidence}%
      </div>
      <div className="text-sm font-medium line-clamp-2">{item.marketTitle}</div>
      <div className="mt-1 text-xs text-fg-muted">{item.headline}</div>
    </Link>
  );
}

function BeliefRow({ item, locale }: { item: BeliefItem; locale: string }) {
  const kindLabel =
    KIND_LABELS[item.marketKind ?? item.beliefKind] ?? item.beliefKind;
  const created = new Date(item.createdAt);
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] tracking-wide text-fg-subtle">
              {kindLabel}
            </span>
            <span className="text-[10px] text-fg-subtle">
              {created.toLocaleDateString()} {created.toLocaleTimeString()}
            </span>
          </div>
          <Link
            href={`/${locale}/market/${item.marketId.replace(/^credence:/, '')}`}
            className="text-sm font-medium hover:text-accent line-clamp-2"
          >
            {item.marketTitle}
          </Link>
          <div className="mt-1 text-sm text-fg">{item.headline}</div>
          {item.rationale ? (
            <div className="mt-2 text-xs text-fg-muted leading-relaxed border-l-2 border-border pl-3">
              {item.rationale}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 w-24 text-right">
          <div className="text-xs text-fg-subtle mb-1">置信度</div>
          <div className="text-lg font-semibold">{item.confidence}%</div>
          <div className="mt-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(Math.max(item.confidence, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

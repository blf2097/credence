'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  getBeliefPortfolio,
  type BeliefItem,
  type BeliefPortfolio,
} from '@/lib/providers/credence-native/belief-portfolio';
import type { CalibrationSummary } from '@/lib/core/calibration';
import { ActionRecommendations } from '@/components/action-recommendations';
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
  const calibration = portfolio?.calibration;

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

      <ActionRecommendations />

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

      {calibration ? <CalibrationSection calibration={calibration} /> : null}

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

// ---------------------------------------------------------------------------
// Calibration section
// ---------------------------------------------------------------------------

function CalibrationSection({ calibration }: { calibration: CalibrationSummary }) {
  const { resolvedCount, pendingCount, averageBrier, scalarIntervalHitRate, averageScalarError, calibrationBuckets, calibrationVerdict } = calibration;

  if (resolvedCount === 0) {
    return (
      <section className="rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-sm font-medium mb-2">Track Record</h2>
        <p className="text-sm text-fg-muted leading-relaxed">
          还没有已结算的预测。在市场详情页点击「手动结算」模拟结果，这里会显示你的 Brier 分数、校准曲线和变量命中率。
        </p>
        {pendingCount > 0 ? (
          <p className="mt-2 text-xs text-fg-subtle">
            当前有 {pendingCount} 个未结算的市场。
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-fg-muted">Track Record</h2>

      <div className="rounded-xl border border-border bg-bg-card p-5">
        <p className="text-sm leading-relaxed">{calibrationVerdict}</p>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="已结算"
            value={resolvedCount.toString()}
            sub={pendingCount > 0 ? `${pendingCount} 待结算` : undefined}
          />
          {calibration.scoredSignals.length > 0 ? (
            <MetricCard
              label="Brier 分数"
              value={averageBrier.toFixed(3)}
              sub={averageBrier <= 0.25 ? '优于随机' : averageBrier <= 0.33 ? '接近随机' : '差于随机'}
              tone={averageBrier <= 0.25 ? 'good' : averageBrier <= 0.33 ? 'neutral' : 'bad'}
            />
          ) : null}
          {calibration.scoredScalars.length > 0 ? (
            <>
              <MetricCard
                label="区间命中率"
                value={`${(scalarIntervalHitRate * 100).toFixed(0)}%`}
                sub="P10-P90 命中"
                tone={scalarIntervalHitRate >= 0.7 ? 'good' : scalarIntervalHitRate >= 0.5 ? 'neutral' : 'bad'}
              />
              <MetricCard
                label="归一化误差"
                value={averageScalarError.toFixed(2)}
                sub="|actual - P50| / range"
                tone={averageScalarError <= 0.2 ? 'good' : averageScalarError <= 0.4 ? 'neutral' : 'bad'}
              />
            </>
          ) : null}
        </div>
      </div>

      {calibrationBuckets.length > 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-xs font-medium text-fg-subtle mb-3">校准曲线</h3>
          <p className="text-xs text-fg-muted mb-4">
            每个置信度区间内的实际命中率。完美校准时，命中率 ≈ 置信度区间中点。
          </p>
          <div className="space-y-2">
            {calibrationBuckets.map((bucket) => {
              const midpoint = (bucket.range[0] + bucket.range[1]) / 2 / 100;
              const diff = bucket.hitRate - midpoint;
              return (
                <div key={bucket.label} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-fg-muted font-mono shrink-0">
                    {bucket.label}
                  </div>
                  <div className="flex-1 h-6 rounded bg-bg-elevated overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${Math.min(bucket.hitRate * 100, 100)}%`,
                        backgroundColor: Math.abs(diff) < 0.1 ? '#0E5C4A' : diff > 0 ? '#4A7C2A' : '#B68A2E',
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-accent/60"
                      style={{ left: `${midpoint * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs text-right shrink-0">
                    <span className="font-mono">{(bucket.hitRate * 100).toFixed(0)}%</span>
                    <span className="text-fg-subtle"> / {bucket.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] text-fg-subtle">
            绿色竖线 = 完美校准点位 · 绿条 = 命中率高于预期 · 金条 = 命中率低于预期
          </div>
        </div>
      ) : null}

      {calibration.scoredSignals.length > 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-xs font-medium text-fg-subtle mb-3">已结算的事件型预测</h3>
          <div className="space-y-2">
            {calibration.scoredSignals.map((scored) => (
              <div key={scored.prediction.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1 truncate">
                  <span className={scored.correct ? 'text-accent' : 'text-accent-danger'}>
                    {scored.correct ? '✓' : '✗'}
                  </span>
                  {' '}
                  <span className="text-fg">{scored.prediction.outcomeLabel}</span>
                  {' '}
                  <span className="text-fg-subtle">— {scored.prediction.marketTitle.slice(0, 30)}</span>
                </div>
                <div className="shrink-0 font-mono text-fg-muted">
                  {scored.prediction.confidence}% → Brier {scored.brierScore.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {calibration.scoredScalars.length > 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-xs font-medium text-fg-subtle mb-3">已结算的变量型预测</h3>
          <div className="space-y-2">
            {calibration.scoredScalars.map((scored) => (
              <div key={scored.prediction.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <span className={scored.intervalHit ? 'text-accent' : 'text-accent-danger'}>
                    {scored.intervalHit ? '✓' : '✗'}
                  </span>
                  {' '}
                  <span className="text-fg-subtle">
                    P10 {scored.prediction.p10} · P50 {scored.prediction.p50} · P90 {scored.prediction.p90}
                  </span>
                  {' → '}
                  <span className="font-mono text-fg">
                    actual {scored.resolution.resolvedValue}
                  </span>
                </div>
                <div className="shrink-0 font-mono text-fg-muted">
                  err {scored.normalizedError.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

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

function MetricCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'neutral' | 'bad';
}) {
  return (
    <div className="rounded-lg bg-bg-elevated p-3">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div
        className={cn(
          'mt-1 text-xl font-semibold',
          tone === 'good' && 'text-accent',
          tone === 'bad' && 'text-accent-danger',
        )}
      >
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[10px] text-fg-subtle">{sub}</div> : null}
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

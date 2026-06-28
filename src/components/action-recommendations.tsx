'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { getBeliefPortfolio } from '@/lib/providers/credence-native/belief-portfolio';
import { getModelUpdates } from '@/lib/providers/credence-native/model-updates';
import { getAllWorldModels, getDynamicMarkets } from '@/lib/providers/credence-native/dynamic-catalog';
import { credenceEvidence, credenceWorldModels } from '@/lib/providers/credence-native/content-loader';
import type { BeliefPortfolio } from '@/lib/providers/credence-native/belief-portfolio';
import type { ModelUpdate } from '@/lib/providers/credence-native/model-updates';
import type { ActionRecommendation } from '@/lib/core/action-recommendation';
import { generateRecommendations } from '@/lib/core/action-recommendation';
import { cn } from '@/lib/utils';

export function ActionRecommendations() {
  const locale = useLocale();
  const [recs, setRecs] = useState<ActionRecommendation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const portfolio: BeliefPortfolio = await getBeliefPortfolio();
      const modelUpdates: ModelUpdate[] = await getModelUpdates();
      const worldModels = typeof window !== 'undefined'
        ? [...getAllWorldModels(), ...credenceWorldModels]
        : credenceWorldModels;
      const evidence = credenceEvidence;

      const predictedMarketIds = new Set(portfolio.items.map((item) => item.marketId));

      const recommendations = generateRecommendations({
        portfolio,
        calibration: portfolio.calibration,
        modelUpdates,
        worldModels,
        evidence,
        predictedMarketIds,
      });

      if (active) {
        setRecs(recommendations);
        setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, []);

  if (!loaded) return null;
  if (recs.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-fg-muted">行动建议</h2>
      <div className="space-y-2">
        {recs.slice(0, 6).map((rec) => (
          <RecCard key={rec.id} rec={rec} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function RecCard({ rec, locale }: { rec: ActionRecommendation; locale: string }) {
  const priorityStyles = {
    high: 'border-accent-danger/40 bg-accent-danger/5',
    medium: 'border-accent-gold/40 bg-accent-gold/5',
    low: 'border-border bg-bg-card',
  };

  const priorityLabel = { high: '高优先级', medium: '中优先级', low: '低优先级' };

  const href = rec.targetId
    ? `/${locale}/market/${rec.targetId.replace(/^credence:/, '')}`
    : null;

  const content = (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide',
            rec.priority === 'high' && 'bg-accent-danger/10 text-accent-danger',
            rec.priority === 'medium' && 'bg-accent-gold/10 text-accent-gold',
            rec.priority === 'low' && 'bg-bg-elevated text-fg-subtle',
          )}
        >
          {priorityLabel[rec.priority]}
        </span>
        <span className="text-xs text-fg-subtle">{typeLabel(rec.type)}</span>
      </div>
      <div className="text-sm font-medium">{rec.title}</div>
      <p className="mt-1 text-xs text-fg-muted leading-relaxed">{rec.detail}</p>
      <div className="mt-2 text-xs text-accent flex items-center gap-1">
        <span>→</span>
        <span>{rec.action}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'block rounded-xl border p-4 transition-colors hover:border-border-strong',
          priorityStyles[rec.priority],
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn('rounded-xl border p-4', priorityStyles[rec.priority])}>
      {content}
    </div>
  );
}

function typeLabel(type: ActionRecommendation['type']): string {
  const labels: Record<string, string> = {
    stale_belief: '信念老化',
    overconfident: '过度自信',
    evidence_gap: '证据缺口',
    calibration_warning: '校准警告',
    missing_prediction: '待预测',
  };
  return labels[type] ?? type;
}

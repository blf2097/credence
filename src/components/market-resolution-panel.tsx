'use client';

import { useEffect, useState } from 'react';
import type { PredictionMarket } from '@/lib/core/market';
import type { MarketResolution } from '@/lib/core/calibration';
import { getResolution, saveResolution, clearResolution } from '@/lib/providers/credence-native/resolutions';
import { getScalarMetadata } from '@/lib/providers/credence-native/scalar-submissions';
import { cn } from '@/lib/utils';

export function MarketResolutionPanel({ market }: { market: PredictionMarket }) {
  const [resolution, setResolution] = useState<MarketResolution | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // For binary: outcome selection
  const [selectedOutcomeId, setSelectedOutcomeId] = useState(market.outcomes[0]?.id ?? '');
  // For scalar: actual value input
  const { min, max, unit } = getScalarMetadata(market);
  const [actualValue, setActualValue] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getResolution(market.id).then((r) => {
      if (active) {
        setResolution(r);
        setLoaded(true);
      }
    });
    return () => { active = false; };
  }, [market.id]);

  async function handleResolve() {
    const input: Omit<MarketResolution, 'resolvedAt'> = {
      marketId: market.id,
      note: note.trim() || undefined,
    };

    if (market.kind === 'scalar') {
      const val = Number(actualValue);
      if (!Number.isFinite(val)) {
        setStatus('请输入有效的数值。');
        return;
      }
      input.resolvedValue = val;
    } else {
      if (!selectedOutcomeId) {
        setStatus('请选择结算结果。');
        return;
      }
      input.resolvedOutcomeId = selectedOutcomeId;
    }

    const saved = await saveResolution(input);
    setResolution(saved);
    setShowForm(false);
    setStatus('已结算。结果已写入 Track Record。');
    setNote('');
    setActualValue('');
  }

  async function handleClear() {
    await clearResolution(market.id);
    setResolution(null);
    setStatus('已撤销结算。');
  }

  if (!loaded) return null;

  if (resolution && !showForm) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="text-[10px] tracking-wider text-accent mb-1">
          RESOLVED
        </div>
        <div className="text-sm font-medium">
          {resolution.resolvedOutcomeId
            ? `结果：${market.outcomes.find((o) => o.id === resolution.resolvedOutcomeId)?.label ?? resolution.resolvedOutcomeId}`
            : resolution.resolvedValue !== undefined
              ? `实际值：${resolution.resolvedValue}${unit ?? ''}`
              : '已结算'}
        </div>
        {resolution.note ? (
          <div className="mt-1 text-xs text-fg-muted">{resolution.note}</div>
        ) : null}
        <div className="mt-1 text-[10px] text-fg-subtle">
          {new Date(resolution.resolvedAt).toLocaleString()}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="mt-3 text-xs text-fg-muted hover:text-accent-danger underline"
        >
          撤销结算
        </button>
        {status ? (
          <div className="mt-2 text-xs text-accent">{status}</div>
        ) : null}
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
          MANUAL RESOLUTION
        </div>
        <p className="text-xs text-fg-muted leading-relaxed mb-3">
          手动结算此市场，用于测试 Track Record。结算后，你在信念组合页面的预测会被评分。
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm hover:border-border-strong"
        >
          手动结算
        </button>
        {status ? (
          <div className="mt-2 text-xs text-accent">{status}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
        MANUAL RESOLUTION
      </div>
      <h3 className="text-sm font-medium mb-3">结算此市场</h3>

      {market.kind === 'scalar' ? (
        <div className="space-y-2">
          <label className="block text-xs text-fg-muted">
            实际值{min !== undefined && max !== undefined ? ` (${min} - ${max}${unit ?? ''})` : ''}
          </label>
          <input
            type="number"
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            placeholder={unit ? `数值 (${unit})` : '数值'}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs text-fg-muted">选择结算结果</label>
          <div className="grid gap-2">
            {market.outcomes.map((outcome) => (
              <button
                key={outcome.id}
                type="button"
                onClick={() => setSelectedOutcomeId(outcome.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selectedOutcomeId === outcome.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-fg-muted hover:border-border-strong',
                )}
              >
                {outcome.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block text-xs text-fg-muted mt-3">备注（可选）</label>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="结算来源或说明"
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none mt-1"
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleResolve}
          className="flex-1 rounded-lg bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          确认结算
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:border-border-strong"
        >
          取消
        </button>
      </div>

      {status ? (
        <div className="mt-2 text-xs text-accent-danger">{status}</div>
      ) : null}
    </div>
  );
}

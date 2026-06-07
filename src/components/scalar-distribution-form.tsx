'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import type { PredictionMarket } from '@/lib/core/market';
import {
  getScalarDistributionSubmissionsForMarket,
  getScalarMetadata,
  saveScalarDistributionSubmission,
  validateScalarDistribution,
  type ScalarDistributionSubmission,
} from '@/lib/providers/credence-native/scalar-submissions';

export function ScalarDistributionForm({ market }: { market: PredictionMarket }) {
  const { address } = useAccount();
  const { min, max, unit, currentEstimate } = getScalarMetadata(market);
  const initialP50 = currentEstimate ?? midpoint(min, max) ?? 50;
  const [p10, setP10] = useState(Math.max(min ?? 0, initialP50 - 15));
  const [p50, setP50] = useState(initialP50);
  const [p90, setP90] = useState(Math.min(max ?? 100, initialP50 + 15));
  const [confidence, setConfidence] = useState(65);
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ScalarDistributionSubmission[]>(() =>
    typeof window === 'undefined'
      ? []
      : getScalarDistributionSubmissionsForMarket(market.id),
  );

  const handleSubmit = () => {
    setError(null);
    setStatus(null);
    const validation = validateScalarDistribution({ p10, p50, p90, min, max });
    if (validation) {
      setError(validation);
      return;
    }

    const saved = saveScalarDistributionSubmission({
      marketId: market.id,
      marketTitle: market.title,
      unit,
      min,
      max,
      p10,
      p50,
      p90,
      confidence,
      rationale: rationale.trim() || undefined,
      trader: address,
    });
    setSubmissions((prev) => [saved, ...prev]);
    setStatus('已保存变量分布预测。本操作只写入本地浏览器，不触发真实资金交易。');
    setRationale('');
  };

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 sticky top-20">
      <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
        CREDENCE NATIVE · SCALAR DISTRIBUTION
      </div>
      <h3 className="font-medium">提交变量分布预测</h3>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        用 P10 / P50 / P90 表达你对连续变量的概率分布。P10 表示你认为有 10% 概率低于该值，P50 是中位数，P90 表示 90% 概率低于该值。
      </p>

      <div className="mt-4 rounded-lg border border-border bg-bg-elevated p-3 text-xs text-fg-muted">
        <div>单位：{unit ?? '—'}</div>
        <div>范围：{min ?? '—'} - {max ?? '—'}</div>
        <div>当前参考估计：{currentEstimate ?? '—'}{unit ?? ''}</div>
      </div>

      <div className="mt-4 space-y-3">
        <NumberField label="P10" value={p10} setValue={setP10} unit={unit} />
        <NumberField label="P50" value={p50} setValue={setP50} unit={unit} />
        <NumberField label="P90" value={p90} setValue={setP90} unit={unit} />

        <label className="block text-xs text-fg-muted">
          主观置信度：{confidence}%
        </label>
        <input
          type="range"
          min="1"
          max="99"
          value={confidence}
          onChange={(event) => setConfidence(Number(event.target.value))}
          className="w-full"
        />

        <label className="block text-xs text-fg-muted">理由 / 证据备注</label>
        <textarea
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          rows={4}
          placeholder="写下你的关键依据、最大不确定性，以及什么证据会让你更新这个分布。"
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-lg bg-fg px-4 py-3 font-medium text-bg hover:opacity-90"
        >
          保存变量分布预测
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-accent-danger/50 bg-accent-danger/10 p-2 text-xs text-accent-danger">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-2 text-xs text-accent">
          {status}
        </div>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>本地分布预测记录</span>
          <span>{submissions.length}</span>
        </div>
        <div className="mt-2 space-y-2 max-h-56 overflow-auto">
          {submissions.length ? (
            submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg bg-bg-elevated p-2 text-xs">
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <span>P10 {submission.p10}{submission.unit ?? ''}</span>
                  <span>P50 {submission.p50}{submission.unit ?? ''}</span>
                  <span>P90 {submission.p90}{submission.unit ?? ''}</span>
                </div>
                <div className="mt-1 text-fg-muted">Confidence {submission.confidence}%</div>
                {submission.rationale ? (
                  <div className="mt-1 text-fg-muted line-clamp-3">
                    {submission.rationale}
                  </div>
                ) : null}
                <div className="mt-1 text-[10px] text-fg-subtle">
                  {new Date(submission.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-fg-muted">暂无本地分布预测。</div>
          )}
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  setValue,
  unit,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  unit?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-fg-muted mb-1">{label}</span>
      <div className="flex items-center rounded-lg border border-border bg-bg-elevated px-3 py-2">
        <input
          type="number"
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="w-full bg-transparent text-sm outline-none"
        />
        {unit ? <span className="ml-2 text-xs text-fg-subtle">{unit}</span> : null}
      </div>
    </label>
  );
}

function midpoint(min?: number, max?: number) {
  if (min === undefined || max === undefined) return undefined;
  return (min + max) / 2;
}

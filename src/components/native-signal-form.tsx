'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import type { PredictionMarket } from '@/lib/core/market';
import {
  getNativeSignalSubmissionsForMarket,
  saveNativeSignalSubmission,
  type NativeSignalSubmission,
} from '@/lib/providers/credence-native/submissions';
import { cn } from '@/lib/utils';

export function NativeSignalForm({ market }: { market: PredictionMarket }) {
  const { address } = useAccount();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState(market.outcomes[0]?.id ?? '');
  const [confidence, setConfidence] = useState(60);
  const [amount, setAmount] = useState(10);
  const [rationale, setRationale] = useState('');
  const [submissions, setSubmissions] = useState<NativeSignalSubmission[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void getNativeSignalSubmissionsForMarket(market.id).then(setSubmissions);
  }, [market.id]);

  const selectedOutcome = useMemo(
    () => market.outcomes.find((outcome) => outcome.id === selectedOutcomeId),
    [market.outcomes, selectedOutcomeId],
  );

  const handleSubmit = async () => {
    if (!selectedOutcome) return;
    const saved = await saveNativeSignalSubmission({
      marketId: market.id,
      marketTitle: market.title,
      marketKind: market.kind,
      outcomeId: selectedOutcome.id,
      outcomeLabel: selectedOutcome.label,
      confidence,
      amount,
      rationale: rationale.trim() || undefined,
      trader: address,
    });
    setSubmissions((prev) => [saved, ...prev]);
    setStatus('已保存模拟信念提交。本操作只写入本地浏览器，不触发真实资金交易。');
    setRationale('');
  };

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 sticky top-20">
      <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
        CREDENCE NATIVE · SIGNAL ONLY
      </div>
      <h3 className="font-medium">模拟提交信念</h3>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        当前 SKU 不接入真实资金交易。这里用于测试事件型、变量型、世界模型型 SKU 的信念提交、校准和后续证据更新流程。
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-xs text-fg-muted">选择结果 / 区间 / 模型状态</label>
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
              <div className="flex items-center justify-between gap-2">
                <span>{outcome.label}</span>
                {outcome.price !== undefined ? (
                  <span className="font-mono text-xs">{(outcome.price * 100).toFixed(1)}%</span>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <label className="block text-xs text-fg-muted">
          置信度：{confidence}%
        </label>
        <input
          type="range"
          min="1"
          max="99"
          value={confidence}
          onChange={(event) => setConfidence(Number(event.target.value))}
          className="w-full"
        />

        <label className="block text-xs text-fg-muted">模拟权重</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
        />

        <label className="block text-xs text-fg-muted">理由 / 证据备注</label>
        <textarea
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          rows={4}
          placeholder="写下你为什么这样判断；后续 AI agent 会把这些备注接入证据和 Bayes 更新流程。"
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOutcome || !Number.isFinite(amount) || amount <= 0}
          className="w-full rounded-lg bg-fg px-4 py-3 font-medium text-bg hover:opacity-90 disabled:opacity-40"
        >
          保存模拟提交
        </button>
      </div>

      {status ? (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-2 text-xs text-accent">
          {status}
        </div>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>本地提交记录</span>
          <span>{submissions.length}</span>
        </div>
        <div className="mt-2 space-y-2 max-h-56 overflow-auto">
          {submissions.length ? (
            submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg bg-bg-elevated p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{submission.outcomeLabel}</span>
                  <span className="font-mono">{submission.confidence}%</span>
                </div>
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
            <div className="text-xs text-fg-muted">暂无本地提交。</div>
          )}
        </div>
      </div>
    </div>
  );
}

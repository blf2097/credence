'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WorldModelNode } from '@/lib/core/market';
import {
  generateEvidenceDraft,
  type EvidenceDraft,
} from '@/lib/providers/credence-native/evidence-drafts';
import {
  getModelUpdates,
  saveModelUpdate,
  type ModelUpdate,
} from '@/lib/providers/credence-native/model-updates';
import { getEffectiveConfidence } from '@/lib/providers/credence-native/model-updates';
import { cn } from '@/lib/utils';

export function EvidenceDraftPanel({
  model,
  seedConfidence,
}: {
  model: WorldModelNode;
  seedConfidence: number;
}) {
  const [draft, setDraft] = useState<EvidenceDraft | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(seedConfidence);
  const [updates, setUpdates] = useState<ModelUpdate[]>([]);
  const [generating, setGenerating] = useState(false);
  const [rationale, setRationale] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const conf = await getEffectiveConfidence(model.id, seedConfidence);
    const allUpdates = await getModelUpdates(model.id);
    setCurrentConfidence(conf);
    setUpdates(allUpdates);
  }, [model.id, seedConfidence]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleGenerate = () => {
    setGenerating(true);
    setStatus(null);
    // Simulate async generation (future: LLM API call)
    setTimeout(() => {
      const next = generateEvidenceDraft({
        model,
        currentConfidence,
      });
      setDraft(next);
      setRationale(next.proposedRationale);
      setGenerating(false);
    }, 600);
  };

  const handleApprove = async () => {
    if (!draft) return;
    const update = await saveModelUpdate({
      modelId: model.id,
      evidenceTitle: draft.title,
      prior: draft.proposedPrior,
      posterior: draft.proposedPosterior,
      rationale: rationale.trim() || draft.proposedRationale,
      createdBy: 'ai_approved',
    });
    setUpdates((prev) => [update, ...prev]);
    setCurrentConfidence(draft.proposedPosterior);
    setDraft(null);
    setRationale('');
    setStatus(`证据已采纳。模型置信度 ${(draft.proposedPrior * 100).toFixed(1)}% → ${(draft.proposedPosterior * 100).toFixed(1)}%`);
  };

  const handleReject = () => {
    setDraft(null);
    setRationale('');
    setStatus('证据草稿已拒绝。');
  };

  const shift = draft
    ? draft.proposedPosterior - draft.proposedPrior
    : 0;

  return (
    <div className="space-y-4">
      {/* Current confidence */}
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
              CURRENT CONFIDENCE
            </div>
            <div className="text-2xl font-semibold text-accent">
              {(currentConfidence * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-fg-subtle">Seed</div>
            <div className="text-sm text-fg-muted">
              {(seedConfidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        {updates.length > 0 ? (
          <div className="mt-2 text-[10px] text-fg-subtle">
            {updates.length} 次更新
          </div>
        ) : null}
      </div>

      {/* Generate button */}
      {!draft ? (
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
            AI EVIDENCE PIPELINE
          </div>
          <h3 className="text-sm font-medium mb-2">证据草稿生成</h3>
          <p className="text-xs text-fg-muted leading-relaxed mb-3">
            基于模型假设和追踪变量，生成一条证据草稿。草稿包含立场判断、影响变量、置信度变更建议和理由。你可以编辑理由后再决定是否采纳。
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-fg px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40"
          >
            {generating ? '生成中…' : '生成证据草稿'}
          </button>
        </div>
      ) : null}

      {/* Draft review */}
      {draft ? (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-wider text-accent">
              EVIDENCE DRAFT · PENDING REVIEW
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] uppercase',
                draft.stance === 'support'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-accent-danger/10 text-accent-danger',
              )}
            >
              {draft.stance === 'support' ? '支持' : '反对'}
            </span>
          </div>

          <div>
            <div className="text-sm font-medium">{draft.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {draft.summary}
            </p>
          </div>

          <div className="rounded-md border border-border bg-bg-card p-2 text-xs">
            <div className="text-fg-subtle mb-1">影响变量</div>
            <div className="flex flex-wrap gap-1">
              {draft.affectedVariables.map((v) => (
                <span key={v} className="rounded bg-bg-elevated px-1.5 py-0.5 text-[10px]">
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-bg-card p-3">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-fg-muted">
                Prior {(draft.proposedPrior * 100).toFixed(1)}%
              </span>
              <span className={shift >= 0 ? 'text-accent' : 'text-accent-danger'}>
                {shift >= 0 ? '↑' : '↓'} {Math.abs(shift * 100).toFixed(1)}%
              </span>
              <span className="text-fg font-semibold">
                {(draft.proposedPosterior * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-fg-muted mb-1">
              理由（可编辑）
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              采纳
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:border-border-strong"
            >
              拒绝
            </button>
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-2 text-xs text-accent">
          {status}
        </div>
      ) : null}

      {/* Update timeline */}
      {updates.length > 0 ? (
        <ModelUpdateTimeline updates={updates} />
      ) : null}
    </div>
  );
}

function ModelUpdateTimeline({ updates }: { updates: ModelUpdate[] }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="text-xs font-medium text-fg-subtle mb-3">置信度更新历史</h3>
      <div className="space-y-3">
        {updates.map((update, i) => {
          const shift = update.posterior - update.prior;
          const isLatest = i === 0;
          return (
            <div
              key={update.id}
              className={cn(
                'relative pl-4 pb-3',
                i < updates.length - 1 && 'border-l-2 border-border',
              )}
            >
              <div
                className={cn(
                  'absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full',
                  shift >= 0 ? 'bg-accent' : 'bg-accent-danger',
                )}
              />
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-mono font-medium',
                    shift >= 0 ? 'text-accent' : 'text-accent-danger',
                  )}
                >
                  {(update.prior * 100).toFixed(1)}% → {(update.posterior * 100).toFixed(1)}%
                </span>
                {isLatest ? (
                  <span className="rounded bg-accent/10 px-1 text-[9px] text-accent">CURRENT</span>
                ) : null}
              </div>
              {update.evidenceTitle ? (
                <div className="text-xs text-fg">{update.evidenceTitle}</div>
              ) : null}
              <div className="mt-1 text-xs text-fg-muted leading-relaxed">
                {update.rationale}
              </div>
              <div className="mt-1 text-[10px] text-fg-subtle">
                {new Date(update.createdAt).toLocaleString()} · {update.createdBy === 'ai_approved' ? 'AI 草稿→人工采纳' : update.createdBy}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

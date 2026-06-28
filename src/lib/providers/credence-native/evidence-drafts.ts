/**
 * Evidence draft generator.
 *
 * This is the entry point for the AI evidence pipeline. In the current MVP
 * it uses a template/heuristic generator that produces structured evidence
 * drafts from a world model's assumptions and variables. The interface is
 * designed so that swapping in a real LLM API call later requires changing
 * only the implementation of `generateEvidenceDraft`, not the UI or storage.
 *
 * Workflow:
 *   1. User clicks "Generate Evidence Draft" on a world model page.
 *   2. This module produces a draft: title, summary, stance, affected
 *      variables, proposed prior→posterior, rationale.
 *   3. User reviews, edits rationale, approves or rejects.
 *   4. On approve: evidence node is saved, model update is recorded,
 *      model confidence shifts to posterior.
 */

import type { WorldModelNode, EvidenceNode } from '@/lib/core/market';

export interface EvidenceDraft {
  id: string;
  modelId: string;
  title: string;
  summary: string;
  stance: 'support' | 'oppose';
  affectedVariables: string[];
  proposedPrior: number;
  proposedPosterior: number;
  proposedRationale: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface EvidenceDraftInput {
  model: WorldModelNode;
  currentConfidence: number;
}

/**
 * Generate an evidence draft for a world model.
 *
 * Current implementation: template-based heuristic. Picks a random
 * assumption/variable combination, generates a plausible evidence summary,
 * and proposes a small confidence shift (±3-8%).
 *
 * Future: replace the body of this function with an LLM API call that
 * takes the model context and returns the same EvidenceDraft shape.
 */
export function generateEvidenceDraft(
  input: EvidenceDraftInput,
): EvidenceDraft {
  const { model, currentConfidence } = input;

  const stance: 'support' | 'oppose' =
    Math.random() > 0.4 ? 'support' : 'oppose';

  const assumptionIndex = Math.floor(Math.random() * model.assumptions.length);
  const variableIndex = Math.floor(Math.random() * model.variables.length);
  const assumption = model.assumptions[assumptionIndex] ?? model.assumptions[0];
  const variable = model.variables[variableIndex] ?? model.variables[0];

  const shift = (Math.random() * 0.05 + 0.03) * (stance === 'support' ? 1 : -1);
  const proposedPrior = currentConfidence;
  const proposedPosterior = Math.max(0.05, Math.min(0.95, currentConfidence + shift));

  const title = stance === 'support'
    ? `新观察支持：${variable}出现积极变化`
    : `新观察质疑：${variable}面临阻力`;

  const summary = stance === 'support'
    ? `基于模型假设"${assumption.slice(0, 40)}..."，近期观察到${variable}出现支持性变化。` +
      `这一变化与模型核心论点一致，但在程度上仍需更多数据确认。`
    : `基于模型假设"${assumption.slice(0, 40)}..."，近期观察到${variable}出现与预期不符的信号。` +
      `这一变化可能削弱模型的核心论点，但尚不构成决定性反驳。`;

  const proposedRationale = stance === 'support'
    ? `该证据在方向上支持模型论点，但影响幅度有限（+${(shift * 100).toFixed(1)}%）。` +
      `建议持续追踪${variable}的后续变化，确认趋势是否持续。`
    : `该证据在方向上削弱模型论点（${(shift * 100).toFixed(1)}%）。` +
      `建议评估这是短期波动还是结构性变化，并关注是否需要调整模型假设。`;

  return {
    id: `draft:${model.id}:${Date.now()}`,
    modelId: model.id,
    title,
    summary,
    stance,
    affectedVariables: [variable],
    proposedPrior,
    proposedPosterior,
    proposedRationale,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Convert an approved draft into an EvidenceNode for storage.
 */
export function draftToEvidenceNode(draft: EvidenceDraft): Omit<EvidenceNode, 'observedAt'> & { observedAt: string } {
  return {
    id: `ev:user:${draft.modelId}:${Date.now()}`,
    title: draft.title,
    sourceUrl: undefined,
    observedAt: draft.createdAt,
    summary: draft.summary,
    supportsModelIds: draft.stance === 'support' ? [draft.modelId] : [],
    opposesModelIds: draft.stance === 'oppose' ? [draft.modelId] : [],
    affectedVariableIds: draft.affectedVariables,
    bayesUpdate: {
      prior: draft.proposedPrior,
      posterior: draft.proposedPosterior,
      rationale: draft.proposedRationale,
    },
  };
}

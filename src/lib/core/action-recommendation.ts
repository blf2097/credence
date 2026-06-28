/**
 * Action Recommendation engine.
 *
 * Pure functions — takes belief portfolio, calibration summary, and model
 * updates as input, outputs a prioritized list of actionable suggestions.
 *
 * This is the final layer of the Credence product: not just recording
 * predictions, but telling you what to do next with them.
 */

import type { BeliefPortfolio } from '@/lib/providers/credence-native/belief-portfolio';
import type { CalibrationSummary } from '@/lib/core/calibration';
import type { ModelUpdate } from '@/lib/providers/credence-native/model-updates';
import type { WorldModelNode, EvidenceNode } from '@/lib/core/market';

export type RecommendationType =
  | 'stale_belief'
  | 'overconfident'
  | 'evidence_gap'
  | 'calibration_warning'
  | 'missing_prediction';

export interface ActionRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  /** Market or model this recommendation relates to. */
  targetId?: string;
  targetTitle?: string;
  /** Suggested action text. */
  action: string;
}

export interface RecommendationContext {
  portfolio: BeliefPortfolio;
  calibration: CalibrationSummary;
  modelUpdates: ModelUpdate[];
  worldModels: WorldModelNode[];
  evidence: EvidenceNode[];
  /** Market IDs the user has already predicted on. */
  predictedMarketIds: Set<string>;
}

export function generateRecommendations(
  ctx: RecommendationContext,
): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];

  recs.push(...checkStaleBeliefs(ctx));
  recs.push(...checkOverconfidence(ctx));
  recs.push(...checkEvidenceGaps(ctx));
  recs.push(...checkCalibrationWarnings(ctx));
  recs.push(...checkMissingPredictions(ctx));

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ---------------------------------------------------------------------------
// Rule 1: Stale beliefs — high confidence, no recent model updates
// ---------------------------------------------------------------------------

function checkStaleBeliefs(ctx: RecommendationContext): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];
  const now = Date.now();
  const STALE_DAYS = 14;

  for (const item of ctx.portfolio.items) {
    if (item.confidence < 70) continue;

    // Check if any model update exists for this market's linked model
    const linkedUpdates = ctx.modelUpdates.filter(
      (u) => u.modelId === item.marketId || u.evidenceTitle?.includes(item.marketTitle.slice(0, 20)),
    );

    const lastUpdate = linkedUpdates[0];
    const lastUpdateDate = lastUpdate
      ? new Date(lastUpdate.createdAt).getTime()
      : 0;

    if (now - lastUpdateDate > STALE_DAYS * 86400000) {
      recs.push({
        id: `stale:${item.id}`,
        type: 'stale_belief',
        priority: item.confidence >= 85 ? 'high' : 'medium',
        title: '高置信度信念缺少新证据',
        detail: `你对"${item.marketTitle.slice(0, 40)}"的置信度为 ${item.confidence}%，但过去 ${STALE_DAYS} 天没有新证据更新。高置信度判断需要持续验证。`,
        targetId: item.marketId,
        targetTitle: item.marketTitle,
        action: '检查是否有新证据可以验证或挑战这个判断',
      });
    }
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Rule 2: Overconfidence — high confidence, calibration shows overconfidence
// ---------------------------------------------------------------------------

function checkOverconfidence(ctx: RecommendationContext): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];

  if (ctx.calibration.scoredSignals.length < 3) return recs;

  const avgConfidence = ctx.calibration.scoredSignals.reduce(
    (acc, s) => acc + s.prediction.confidence,
    0,
  ) / ctx.calibration.scoredSignals.length;
  const hitRate = ctx.calibration.scoredSignals.filter((s) => s.correct).length /
    ctx.calibration.scoredSignals.length;
  const gap = avgConfidence / 100 - hitRate;

  if (gap <= 0.15) return recs;

  // Find specific high-confidence predictions that are wrong
  const wrong = ctx.calibration.scoredSignals
    .filter((s) => !s.correct && s.prediction.confidence >= 75)
    .slice(0, 3);

  for (const scored of wrong) {
    recs.push({
      id: `overconfident:${scored.prediction.id}`,
      type: 'overconfident',
      priority: 'high',
      title: '过度自信的预测已出错',
      detail: `你以 ${scored.prediction.confidence}% 置信度预测"${scored.prediction.outcomeLabel}"，但结果相反。平均置信度 ${(avgConfidence).toFixed(0)}% vs 实际命中率 ${(hitRate * 100).toFixed(0)}%。`,
      targetId: scored.prediction.marketId,
      targetTitle: scored.prediction.marketTitle,
      action: '降低同类问题的置信度，或收集更多证据后再做判断',
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Rule 3: Evidence gaps — world models with few evidence nodes
// ---------------------------------------------------------------------------

function checkEvidenceGaps(ctx: RecommendationContext): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];

  for (const model of ctx.worldModels) {
    const totalEvidence =
      model.supportingEvidenceIds.length + model.opposingEvidenceIds.length;

    if (totalEvidence < 2) {
      recs.push({
        id: `evidence_gap:${model.id}`,
        type: 'evidence_gap',
        priority: 'medium',
        title: '世界模型证据不足',
        detail: `"${model.title}"只有 ${totalEvidence} 条证据。置信度为 ${(model.confidence * 100).toFixed(0)}%，但支撑证据太少，判断基础薄弱。`,
        targetId: model.id,
        targetTitle: model.title,
        action: '为这个模型生成新的证据草稿，或手动添加已知证据',
      });
    }
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Rule 4: Calibration warnings — Brier score persistently high
// ---------------------------------------------------------------------------

function checkCalibrationWarnings(
  ctx: RecommendationContext,
): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];

  if (ctx.calibration.scoredSignals.length < 5) return recs;

  if (ctx.calibration.averageBrier > 0.33) {
    recs.push({
      id: 'calibration:global',
      type: 'calibration_warning',
      priority: 'high',
      title: '整体预测准确率偏低',
      detail: `你的平均 Brier 分数为 ${ctx.calibration.averageBrier.toFixed(3)}（随机预测约 0.25）。这意味着你的预测准确率低于随机水平，需要系统性调整判断方法。`,
      action: '降低置信度区间，在更多证据出现前不要给出高置信度判断',
    });
  } else if (ctx.calibration.averageBrier > 0.25 && ctx.calibration.scoredSignals.length >= 5) {
    recs.push({
      id: 'calibration:marginal',
      type: 'calibration_warning',
      priority: 'medium',
      title: '预测准确率接近随机',
      detail: `你的平均 Brier 分数为 ${ctx.calibration.averageBrier.toFixed(3)}，接近随机水平（0.25）。校准曲线可能显示你存在系统性偏差。`,
      action: '查看校准曲线，找出哪些置信度区间偏差最大',
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Rule 5: Missing predictions — world models with linked markets user hasn't predicted on
// ---------------------------------------------------------------------------

function checkMissingPredictions(
  ctx: RecommendationContext,
): ActionRecommendation[] {
  const recs: ActionRecommendation[] = [];

  for (const model of ctx.worldModels) {
    for (const marketId of model.predictionMarketIds) {
      if (ctx.predictedMarketIds.has(marketId)) continue;

      recs.push({
        id: `missing:${marketId}`,
        type: 'missing_prediction',
        priority: 'low',
        title: '关联市场尚未提交预测',
        detail: `世界模型"${model.title.slice(0, 30)}"关联了预测市场，但你还没有在这个市场上提交信念。`,
        targetId: marketId,
        action: '去这个市场提交你的信念',
      });
    }
  }

  return recs;
}

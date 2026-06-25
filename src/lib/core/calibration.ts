/**
 * Calibration and scoring engine.
 *
 * Pure functions — no I/O, no React. These take predictions + resolutions
 * and produce scores that tell you how good your judgment actually is.
 *
 * Scoring model:
 *
 * Binary / event predictions:
 *   - User picks an outcome with confidence X%.
 *   - Forecast probability for the chosen outcome = X/100.
 *   - Brier score = (forecast_prob - actual)^2
 *     where actual = 1 if the chosen outcome won, 0 if it lost.
 *   - Brier ranges 0 (perfect) to 1 (worst). 0.25 = random for binary.
 *
 * Scalar distributions:
 *   - User submits P10, P50, P90.
 *   - Interval hit: did the actual value fall within [P10, P90]?
 *     A well-calibrated forecaster hits ~80% of the time.
 *   - Normalized error: |actual - P50| / (max - min), capped at 1.
 *
 * Calibration buckets:
 *   - Group predictions by confidence into buckets.
 *   - Compare predicted confidence to actual hit rate.
 *   - A perfectly calibrated forecaster's hit rate ≈ bucket midpoint.
 */

import type { NativeSignalPrediction, ScalarDistributionPrediction } from '@/lib/core/repositories/prediction-repository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketResolution {
  marketId: string;
  /** For binary/categorical: the outcomeId that won. */
  resolvedOutcomeId?: string;
  /** For scalar: the actual observed value. */
  resolvedValue?: number;
  resolvedAt: string;
  note?: string;
}

export interface ScoredSignal {
  prediction: NativeSignalPrediction;
  resolution: MarketResolution;
  brierScore: number;
  correct: boolean;
  forecastProb: number;
}

export interface ScoredScalar {
  prediction: ScalarDistributionPrediction;
  resolution: MarketResolution;
  intervalHit: boolean;
  normalizedError: number;
}

export interface CalibrationBucket {
  label: string;
  range: [number, number];
  total: number;
  correct: number;
  hitRate: number;
}

export interface CalibrationSummary {
  resolvedCount: number;
  pendingCount: number;
  /** Average Brier score for resolved binary predictions. Lower is better. */
  averageBrier: number;
  /** Scalar predictions where actual fell within [P10, P90]. */
  scalarIntervalHitRate: number;
  /** Average normalized error for scalar predictions. Lower is better. */
  averageScalarError: number;
  calibrationBuckets: CalibrationBucket[];
  scoredSignals: ScoredSignal[];
  scoredScalars: ScoredScalar[];
  /** Human-readable judgment: are you overconfident, underconfident, or calibrated? */
  calibrationVerdict: string;
}

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/**
 * Score a single binary/event prediction against a resolution.
 *
 * Returns null if the resolution doesn't match this prediction's market.
 */
export function scoreSignal(
  prediction: NativeSignalPrediction,
  resolution: MarketResolution,
): ScoredSignal | null {
  if (resolution.marketId !== prediction.marketId) return null;

  const forecastProb = prediction.confidence / 100;
  const correct = prediction.outcomeId === resolution.resolvedOutcomeId;
  const actual = correct ? 1 : 0;
  const brierScore = Math.pow(forecastProb - actual, 2);

  return { prediction, resolution, brierScore, correct, forecastProb };
}

/**
 * Score a single scalar distribution prediction against a resolution.
 */
export function scoreScalar(
  prediction: ScalarDistributionPrediction,
  resolution: MarketResolution,
): ScoredScalar | null {
  if (resolution.marketId !== prediction.marketId) return null;
  if (typeof resolution.resolvedValue !== 'number') return null;

  const actual = resolution.resolvedValue;
  const intervalHit = actual >= prediction.p10 && actual <= prediction.p90;

  const range = prediction.max && prediction.min
    ? prediction.max - prediction.min
    : Math.max(prediction.p90 - prediction.p10, 1);
  const rawError = Math.abs(actual - prediction.p50);
  const normalizedError = Math.min(rawError / range, 1);

  return { prediction, resolution, intervalHit, normalizedError };
}

// ---------------------------------------------------------------------------
// Calibration buckets
// ---------------------------------------------------------------------------

const BUCKET_RANGES: [number, number][] = [
  [0, 20],
  [20, 40],
  [40, 60],
  [60, 80],
  [80, 100],
];

function buildCalibrationBuckets(scored: ScoredSignal[]): CalibrationBucket[] {
  return BUCKET_RANGES.map(([lo, hi]) => {
    const inBucket = scored.filter(
      (s) => s.prediction.confidence >= lo && s.prediction.confidence < (hi === 100 ? 101 : hi),
    );
    const total = inBucket.length;
    const correct = inBucket.filter((s) => s.correct).length;
    const hitRate = total === 0 ? 0 : correct / total;
    return {
      label: `${lo}-${hi}%`,
      range: [lo, hi] as [number, number],
      total,
      correct,
      hitRate,
    };
  }).filter((b) => b.total > 0);
}

// ---------------------------------------------------------------------------
// Full calibration summary
// ---------------------------------------------------------------------------

export function buildCalibrationSummary(
  signals: NativeSignalPrediction[],
  scalars: ScalarDistributionPrediction[],
  resolutions: MarketResolution[],
): CalibrationSummary {
  const resolutionMap = new Map(resolutions.map((r) => [r.marketId, r]));

  const scoredSignals: ScoredSignal[] = [];
  const scoredScalars: ScoredScalar[] = [];

  const resolvedSignalMarketIds = new Set<string>();
  const resolvedScalarMarketIds = new Set<string>();

  for (const signal of signals) {
    const resolution = resolutionMap.get(signal.marketId);
    if (!resolution) continue;
    const scored = scoreSignal(signal, resolution);
    if (scored) {
      scoredSignals.push(scored);
      resolvedSignalMarketIds.add(signal.marketId);
    }
  }

  for (const scalar of scalars) {
    const resolution = resolutionMap.get(scalar.marketId);
    if (!resolution) continue;
    const scored = scoreScalar(scalar, resolution);
    if (scored) {
      scoredScalars.push(scored);
      resolvedScalarMarketIds.add(scalar.marketId);
    }
  }

  const resolvedCount = resolvedSignalMarketIds.size + resolvedScalarMarketIds.size;
  const pendingMarketIds = new Set<string>([
    ...new Set(signals.map((s) => s.marketId)),
    ...new Set(scalars.map((s) => s.marketId)),
  ]);
  for (const id of resolutionMap.keys()) {
    pendingMarketIds.delete(id);
  }
  const pendingCount = pendingMarketIds.size;

  const averageBrier =
    scoredSignals.length === 0
      ? 0
      : scoredSignals.reduce((acc, s) => acc + s.brierScore, 0) / scoredSignals.length;

  const scalarIntervalHitRate =
    scoredScalars.length === 0
      ? 0
      : scoredScalars.filter((s) => s.intervalHit).length / scoredScalars.length;

  const averageScalarError =
    scoredScalars.length === 0
      ? 0
      : scoredScalars.reduce((acc, s) => acc + s.normalizedError, 0) / scoredScalars.length;

  const calibrationBuckets = buildCalibrationBuckets(scoredSignals);

  const calibrationVerdict = buildVerdict(scoredSignals, calibrationBuckets);

  return {
    resolvedCount,
    pendingCount,
    averageBrier,
    scalarIntervalHitRate,
    averageScalarError,
    calibrationBuckets,
    scoredSignals,
    scoredScalars,
    calibrationVerdict,
  };
}

function buildVerdict(
  scored: ScoredSignal[],
  buckets: CalibrationBucket[],
): string {
  if (scored.length < 3) {
    return '数据不足。提交更多预测并等待市场结算后，才能评估校准水平。';
  }

  // Compare average confidence to actual hit rate.
  const avgConfidence = scored.reduce((acc, s) => acc + s.prediction.confidence, 0) / scored.length;
  const hitRate = scored.filter((s) => s.correct).length / scored.length;
  const gap = avgConfidence / 100 - hitRate;

  if (gap > 0.15) {
    return `过度自信：平均置信度 ${(avgConfidence / 100 * 100).toFixed(0)}%，实际命中率 ${(hitRate * 100).toFixed(0)}%。你高估了自己的判断准确性。`;
  }
  if (gap < -0.1) {
    return `偏保守：平均置信度 ${(avgConfidence / 100 * 100).toFixed(0)}%，实际命中率 ${(hitRate * 100).toFixed(0)}%。你的判断比你以为的更准。`;
  }
  return `校准良好：平均置信度 ${(avgConfidence / 100 * 100).toFixed(0)}%，实际命中率 ${(hitRate * 100).toFixed(0)}%。你的置信度和命中率基本对齐。`;
}

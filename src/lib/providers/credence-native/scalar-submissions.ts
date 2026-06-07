import type { Address } from 'viem';
import type { PredictionMarket } from '@/lib/core/market';

const SCALAR_SUBMISSIONS_KEY = 'credence:native-scalar-submissions:v1';

export interface ScalarDistributionSubmission {
  id: string;
  marketId: string;
  marketTitle: string;
  unit?: string;
  min?: number;
  max?: number;
  p10: number;
  p50: number;
  p90: number;
  confidence: number;
  rationale?: string;
  trader?: Address;
  createdAt: string;
}

export function saveScalarDistributionSubmission(
  submission: Omit<ScalarDistributionSubmission, 'id' | 'createdAt'>,
): ScalarDistributionSubmission {
  const next: ScalarDistributionSubmission = {
    ...submission,
    id: `scalar:${submission.marketId}:${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = getScalarDistributionSubmissions();
  window.localStorage.setItem(
    SCALAR_SUBMISSIONS_KEY,
    JSON.stringify([next, ...existing]),
  );
  return next;
}

export function getScalarDistributionSubmissions(): ScalarDistributionSubmission[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(SCALAR_SUBMISSIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScalarDistributionSubmission[]) : [];
  } catch {
    window.localStorage.removeItem(SCALAR_SUBMISSIONS_KEY);
    return [];
  }
}

export function getScalarDistributionSubmissionsForMarket(marketId: string) {
  return getScalarDistributionSubmissions().filter(
    (submission) => submission.marketId === marketId,
  );
}

export function getScalarMetadata(market: PredictionMarket) {
  const range = Array.isArray(market.metadata?.range)
    ? (market.metadata.range as unknown[])
    : [];
  const min = typeof range[0] === 'number' ? range[0] : undefined;
  const max = typeof range[1] === 'number' ? range[1] : undefined;
  const currentEstimate =
    typeof market.metadata?.currentEstimate === 'number'
      ? market.metadata.currentEstimate
      : undefined;
  const unit = typeof market.metadata?.unit === 'string' ? market.metadata.unit : undefined;

  return { min, max, currentEstimate, unit };
}

export function validateScalarDistribution(input: {
  p10: number;
  p50: number;
  p90: number;
  min?: number;
  max?: number;
}) {
  const { p10, p50, p90, min, max } = input;
  if (![p10, p50, p90].every(Number.isFinite)) {
    return 'P10、P50、P90 必须是数字。';
  }
  if (min !== undefined && (p10 < min || p50 < min || p90 < min)) {
    return `分布值不能低于 ${min}。`;
  }
  if (max !== undefined && (p10 > max || p50 > max || p90 > max)) {
    return `分布值不能高于 ${max}。`;
  }
  if (p10 > p50 || p50 > p90) {
    return '必须满足 P10 <= P50 <= P90。';
  }
  return null;
}

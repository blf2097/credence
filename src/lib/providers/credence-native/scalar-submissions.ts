import type { PredictionMarket } from '@/lib/core/market';
import {
  localStoragePredictionRepository,
} from '@/lib/providers/local-storage/prediction-repository';
import type { ScalarDistributionPrediction } from '@/lib/core/repositories/prediction-repository';

export type ScalarDistributionSubmission = ScalarDistributionPrediction;

export async function saveScalarDistributionSubmission(
  submission: Omit<ScalarDistributionSubmission, 'id' | 'createdAt'>,
): Promise<ScalarDistributionSubmission> {
  return localStoragePredictionRepository.saveScalarDistributionPrediction(submission);
}

export async function getScalarDistributionSubmissions(): Promise<ScalarDistributionSubmission[]> {
  return localStoragePredictionRepository.listScalarDistributionPredictions();
}

export async function getScalarDistributionSubmissionsForMarket(marketId: string) {
  return localStoragePredictionRepository.listScalarDistributionPredictions(marketId);
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

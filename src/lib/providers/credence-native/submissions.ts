import type { Address } from 'viem';
import type { PredictionMarket } from '@/lib/core/market';
import { getPredictionRepository } from '@/lib/core/repositories/get-prediction-repository';
import type { NativeSignalPrediction } from '@/lib/core/repositories/prediction-repository';

export type NativeSignalSubmission = NativeSignalPrediction;

export async function saveNativeSignalSubmission(
  submission: Omit<NativeSignalSubmission, 'id' | 'createdAt'>,
): Promise<NativeSignalSubmission> {
  return getPredictionRepository().saveNativeSignalPrediction(submission);
}

export async function getNativeSignalSubmissions(): Promise<NativeSignalSubmission[]> {
  return getPredictionRepository().listNativeSignalPredictions();
}

export async function getNativeSignalSubmissionsForMarket(marketId: string) {
  return getPredictionRepository().listNativeSignalPredictions(marketId);
}

export type { Address, PredictionMarket };

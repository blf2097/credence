import type { Address } from 'viem';
import type { PredictionMarket } from '@/lib/core/market';
import {
  localStoragePredictionRepository,
} from '@/lib/providers/local-storage/prediction-repository';
import type { NativeSignalPrediction } from '@/lib/core/repositories/prediction-repository';

export type NativeSignalSubmission = NativeSignalPrediction;

export async function saveNativeSignalSubmission(
  submission: Omit<NativeSignalSubmission, 'id' | 'createdAt'>,
): Promise<NativeSignalSubmission> {
  return localStoragePredictionRepository.saveNativeSignalPrediction(submission);
}

export async function getNativeSignalSubmissions(): Promise<NativeSignalSubmission[]> {
  return localStoragePredictionRepository.listNativeSignalPredictions();
}

export async function getNativeSignalSubmissionsForMarket(marketId: string) {
  return localStoragePredictionRepository.listNativeSignalPredictions(marketId);
}

export type { Address, PredictionMarket };

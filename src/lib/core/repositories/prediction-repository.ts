import type { Address } from 'viem';
import type { PredictionMarket } from '@/lib/core/market';

export interface NativeSignalPrediction {
  id: string;
  marketId: string;
  marketTitle: string;
  marketKind: PredictionMarket['kind'];
  outcomeId: string;
  outcomeLabel: string;
  confidence: number;
  amount: number;
  rationale?: string;
  trader?: Address;
  createdAt: string;
}

export interface ScalarDistributionPrediction {
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

export interface PredictionRepository {
  saveNativeSignalPrediction(
    prediction: Omit<NativeSignalPrediction, 'id' | 'createdAt'>,
  ): Promise<NativeSignalPrediction>;
  listNativeSignalPredictions(marketId?: string): Promise<NativeSignalPrediction[]>;
  saveScalarDistributionPrediction(
    prediction: Omit<ScalarDistributionPrediction, 'id' | 'createdAt'>,
  ): Promise<ScalarDistributionPrediction>;
  listScalarDistributionPredictions(
    marketId?: string,
  ): Promise<ScalarDistributionPrediction[]>;
}

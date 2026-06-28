import type { EvidenceNode, PredictionMarket, WorldModelNode } from '@/lib/core/market';
import {
  credenceEvidence,
  credenceNativeMarkets,
  credenceWorldModels,
} from './content-loader';
import { getAllNativeMarkets, getAllWorldModels } from './dynamic-catalog';

export interface WorldModelBundle {
  model: WorldModelNode;
  supportingEvidence: EvidenceNode[];
  opposingEvidence: EvidenceNode[];
  linkedMarkets: PredictionMarket[];
}

export function getWorldModelBundleByMarket(
  market: PredictionMarket,
): WorldModelBundle | null {
  const modelId = market.metadata?.worldModelId;
  if (typeof modelId !== 'string') return null;
  return getWorldModelBundle(modelId);
}

export function getWorldModelBundle(modelId: string): WorldModelBundle | null {
  const allModels = typeof window !== 'undefined' ? getAllWorldModels() : credenceWorldModels;
  const model = allModels.find((item) => item.id === modelId);
  if (!model) return null;

  const allMarkets = typeof window !== 'undefined' ? getAllNativeMarkets() : credenceNativeMarkets;

  return {
    model,
    supportingEvidence: model.supportingEvidenceIds
      .map(getEvidenceById)
      .filter(Boolean) as EvidenceNode[],
    opposingEvidence: model.opposingEvidenceIds
      .map(getEvidenceById)
      .filter(Boolean) as EvidenceNode[],
    linkedMarkets: model.predictionMarketIds
      .map((id) => allMarkets.find((market) => market.id === id))
      .filter(Boolean) as PredictionMarket[],
  };
}

/** List all world models (static + dynamic). */
export function listAllWorldModelBundles(): WorldModelBundle[] {
  const allModels = typeof window !== 'undefined' ? getAllWorldModels() : credenceWorldModels;
  return allModels.map((model) => getWorldModelBundle(model.id)).filter(Boolean) as WorldModelBundle[];
}

function getEvidenceById(id: string) {
  return credenceEvidence.find((item) => item.id === id) ?? null;
}

import type { EvidenceNode, PredictionMarket, WorldModelNode } from '@/lib/core/market';
import {
  credenceEvidence,
  credenceNativeMarkets,
  credenceWorldModels,
} from './content-loader';

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
  const model = credenceWorldModels.find((item) => item.id === modelId);
  if (!model) return null;

  return {
    model,
    supportingEvidence: model.supportingEvidenceIds
      .map(getEvidenceById)
      .filter(Boolean) as EvidenceNode[],
    opposingEvidence: model.opposingEvidenceIds
      .map(getEvidenceById)
      .filter(Boolean) as EvidenceNode[],
    linkedMarkets: model.predictionMarketIds
      .map((id) => credenceNativeMarkets.find((market) => market.id === id))
      .filter(Boolean) as PredictionMarket[],
  };
}

function getEvidenceById(id: string) {
  return credenceEvidence.find((item) => item.id === id) ?? null;
}

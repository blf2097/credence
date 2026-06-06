import marketsJson from '@/content/native-skus/markets.json';
import worldModelsJson from '@/content/native-skus/world-models.json';
import evidenceJson from '@/content/native-skus/evidence.json';
import type { EvidenceNode, PredictionMarket, WorldModelNode } from '@/lib/core/market';

export const credenceNativeMarkets = normalizeMarkets(marketsJson);
export const credenceWorldModels = normalizeWorldModels(worldModelsJson);
export const credenceEvidence = normalizeEvidence(evidenceJson);

function normalizeMarkets(input: unknown): PredictionMarket[] {
  if (!Array.isArray(input)) throw new Error('native-skus/markets.json must be an array');
  return input.map((item, index) => {
    const market = item as PredictionMarket;
    assertString(market.id, `markets[${index}].id`);
    if (market.provider !== 'credence') {
      throw new Error(`markets[${index}].provider must be "credence"`);
    }
    assertString(market.kind, `markets[${index}].kind`);
    assertString(market.settlementType, `markets[${index}].settlementType`);
    assertString(market.title, `markets[${index}].title`);
    assertString(market.description, `markets[${index}].description`);
    if (!Array.isArray(market.outcomes) || market.outcomes.length === 0) {
      throw new Error(`markets[${index}].outcomes must be a non-empty array`);
    }
    if (!market.trading?.mode) throw new Error(`markets[${index}].trading.mode is required`);
    if (!market.source?.externalId) {
      throw new Error(`markets[${index}].source.externalId is required`);
    }
    return {
      ...market,
      metrics: market.metrics ?? {},
      tags: market.tags ?? [],
      metadata: {
        ...(market.metadata ?? {}),
        contentSource: 'src/content/native-skus/markets.json',
      },
    };
  });
}

function normalizeWorldModels(input: unknown): WorldModelNode[] {
  if (!Array.isArray(input)) throw new Error('native-skus/world-models.json must be an array');
  return input as WorldModelNode[];
}

function normalizeEvidence(input: unknown): EvidenceNode[] {
  if (!Array.isArray(input)) throw new Error('native-skus/evidence.json must be an array');
  return input as EvidenceNode[];
}

function assertString(value: unknown, path: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

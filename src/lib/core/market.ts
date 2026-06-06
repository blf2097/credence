export type MarketProvider = 'polymarket' | 'credence';
export type MarketKind = 'binary' | 'categorical' | 'scalar' | 'world_model';
export type SettlementType = 'event' | 'variable' | 'model_score';
export type TradingMode = 'external_clob' | 'internal' | 'signal_only';

export interface MarketOutcome {
  id: string;
  label: string;
  price?: number;
  tokenId?: string;
  sortOrder: number;
}

export interface MarketMetric {
  volume?: number;
  volume24hr?: number;
  liquidity?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
}

export interface MarketSourceRef {
  provider: MarketProvider;
  externalId: string;
  slug?: string;
  conditionId?: string;
  eventSlug?: string;
  seriesSlug?: string;
}

export interface MarketTradingSpec {
  mode: TradingMode;
  chainId?: number;
  collateralSymbol?: string;
  minTickSize?: string;
  negRisk?: boolean;
  acceptingOrders: boolean;
}

export interface PredictionMarket {
  id: string;
  provider: MarketProvider;
  kind: MarketKind;
  settlementType: SettlementType;
  title: string;
  description: string;
  category?: string;
  image?: string;
  icon?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  outcomes: MarketOutcome[];
  metrics: MarketMetric;
  trading: MarketTradingSpec;
  source: MarketSourceRef;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface WorldModelNode {
  id: string;
  title: string;
  thesis: string;
  confidence: number;
  horizon?: string;
  assumptions: string[];
  variables: string[];
  predictionMarketIds: string[];
  supportingEvidenceIds: string[];
  opposingEvidenceIds: string[];
  parentModelIds?: string[];
  competingModelIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface EvidenceNode {
  id: string;
  title: string;
  sourceUrl?: string;
  observedAt: string;
  summary: string;
  supportsModelIds: string[];
  opposesModelIds: string[];
  affectedVariableIds: string[];
  bayesUpdate?: {
    prior: number;
    posterior: number;
    rationale: string;
  };
}

export function getPrimaryOutcome(market: PredictionMarket) {
  return market.outcomes[0];
}

export function getOutcomeByLabel(market: PredictionMarket, label: string) {
  return market.outcomes.find(
    (outcome) => outcome.label.toLowerCase() === label.toLowerCase(),
  );
}

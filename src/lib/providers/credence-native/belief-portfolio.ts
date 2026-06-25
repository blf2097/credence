import type { MarketKind } from '@/lib/core/market';
import type {
  NativeSignalPrediction,
  ScalarDistributionPrediction,
} from '@/lib/core/repositories/prediction-repository';
import {
  getNativeSignalSubmissions,
} from './submissions';
import {
  getScalarDistributionSubmissions,
} from './scalar-submissions';

/**
 * A unified view over everything a user currently "believes" inside Credence.
 *
 * Two prediction shapes live behind this:
 *  - event / world_model signals (a chosen outcome + confidence)
 *  - scalar distribution forecasts (P10/P50/P90 + confidence)
 *
 * Belief Portfolio normalizes both into one timeline so the user can see the
 * full set of positions they hold on the future, not one prediction at a time.
 */
export type BeliefKind = 'signal' | 'scalar';

export interface BeliefItem {
  id: string;
  beliefKind: BeliefKind;
  marketId: string;
  marketTitle: string;
  marketKind?: MarketKind;
  /** Human-readable summary of the belief itself. */
  headline: string;
  confidence: number;
  rationale?: string;
  createdAt: string;
  /** Raw payloads kept for detail views / future analytics. */
  signal?: NativeSignalPrediction;
  scalar?: ScalarDistributionPrediction;
}

export interface BeliefPortfolioSummary {
  total: number;
  signalCount: number;
  scalarCount: number;
  averageConfidence: number;
  /** Highest-confidence belief, useful for "your strongest conviction". */
  strongest?: BeliefItem;
  /** Lowest-confidence belief, useful for "your most uncertain take". */
  weakest?: BeliefItem;
  byKind: Record<string, number>;
}

export interface BeliefPortfolio {
  items: BeliefItem[];
  summary: BeliefPortfolioSummary;
}

function signalToBelief(signal: NativeSignalPrediction): BeliefItem {
  return {
    id: signal.id,
    beliefKind: 'signal',
    marketId: signal.marketId,
    marketTitle: signal.marketTitle,
    marketKind: signal.marketKind,
    headline: signal.outcomeLabel,
    confidence: signal.confidence,
    rationale: signal.rationale,
    createdAt: signal.createdAt,
    signal,
  };
}

function scalarToBelief(scalar: ScalarDistributionPrediction): BeliefItem {
  const unit = scalar.unit ? scalar.unit : '';
  const headline = `P10 ${scalar.p10}${unit} · P50 ${scalar.p50}${unit} · P90 ${scalar.p90}${unit}`;
  return {
    id: scalar.id,
    beliefKind: 'scalar',
    marketId: scalar.marketId,
    marketTitle: scalar.marketTitle,
    marketKind: 'scalar',
    headline,
    confidence: scalar.confidence,
    rationale: scalar.rationale,
    createdAt: scalar.createdAt,
    scalar,
  };
}

function buildSummary(items: BeliefItem[]): BeliefPortfolioSummary {
  const total = items.length;
  const signalCount = items.filter((item) => item.beliefKind === 'signal').length;
  const scalarCount = items.filter((item) => item.beliefKind === 'scalar').length;
  const averageConfidence =
    total === 0
      ? 0
      : Math.round(
          items.reduce((acc, item) => acc + (item.confidence ?? 0), 0) / total,
        );

  const sortedByConfidence = [...items].sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
  );

  const byKind: Record<string, number> = {};
  for (const item of items) {
    const key = item.marketKind ?? item.beliefKind;
    byKind[key] = (byKind[key] ?? 0) + 1;
  }

  return {
    total,
    signalCount,
    scalarCount,
    averageConfidence,
    strongest: sortedByConfidence[0],
    weakest: sortedByConfidence[sortedByConfidence.length - 1],
    byKind,
  };
}

/**
 * Load the full belief portfolio for the current user.
 *
 * Reads through the repository-backed submission helpers, so when the storage
 * layer later moves from localStorage to Supabase this function does not change.
 */
export async function getBeliefPortfolio(): Promise<BeliefPortfolio> {
  const [signals, scalars] = await Promise.all([
    getNativeSignalSubmissions(),
    getScalarDistributionSubmissions(),
  ]);

  const items: BeliefItem[] = [
    ...signals.map(signalToBelief),
    ...scalars.map(scalarToBelief),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return { items, summary: buildSummary(items) };
}

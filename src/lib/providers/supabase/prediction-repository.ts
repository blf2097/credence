import { getSupabaseClient } from './client';
import type {
  NativeSignalPrediction,
  PredictionRepository,
  ScalarDistributionPrediction,
} from '@/lib/core/repositories/prediction-repository';

/**
 * Supabase-backed prediction repository.
 *
 * Writes to `native_signal_predictions` and `scalar_distribution_predictions`.
 * Falls back gracefully — if the Supabase client is null at call-time the
 * methods throw, signalling the resolver to use localStorage instead.
 *
 * RLS note: with anon key + RLS, rows are scoped to `auth.uid()` or
 * `wallet_address`. For the MVP we store `wallet_address` as a plain text
 * column and rely on RLS policies to filter. Users without a connected wallet
 * should use the localStorage repository, not this one.
 */

interface SupabaseSignalRow {
  id: string;
  market_id: string;
  market_kind: string;
  outcome_id: string;
  outcome_label: string;
  confidence: number;
  amount: number;
  rationale: string | null;
  wallet_address: string | null;
  created_at: string;
}

interface SupabaseScalarRow {
  id: string;
  market_id: string;
  unit: string | null;
  min_value: number | null;
  max_value: number | null;
  p10: number;
  p50: number;
  p90: number;
  confidence: number;
  rationale: string | null;
  wallet_address: string | null;
  created_at: string;
}

export class SupabasePredictionRepository implements PredictionRepository {
  private client = getSupabaseClient();

  private ensureClient() {
    if (!this.client) {
      throw new Error('Supabase client is not initialized');
    }
    return this.client;
  }

  async saveNativeSignalPrediction(
    prediction: Omit<NativeSignalPrediction, 'id' | 'createdAt'>,
  ): Promise<NativeSignalPrediction> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('native_signal_predictions')
      .insert({
        market_id: prediction.marketId,
        market_kind: prediction.marketKind,
        outcome_id: prediction.outcomeId,
        outcome_label: prediction.outcomeLabel,
        confidence: prediction.confidence,
        amount: prediction.amount,
        rationale: prediction.rationale ?? null,
        wallet_address: prediction.trader ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to save signal prediction: ${error?.message ?? 'no data returned'}`,
      );
    }

    const row = data as unknown as SupabaseSignalRow;
    return {
      id: row.id,
      marketId: row.market_id,
      marketTitle: prediction.marketTitle,
      marketKind: row.market_kind as NativeSignalPrediction['marketKind'],
      outcomeId: row.outcome_id,
      outcomeLabel: row.outcome_label,
      confidence: Number(row.confidence),
      amount: Number(row.amount),
      rationale: row.rationale ?? undefined,
      trader: (row.wallet_address ?? undefined) as NativeSignalPrediction['trader'],
      createdAt: row.created_at,
    };
  }

  async listNativeSignalPredictions(
    marketId?: string,
  ): Promise<NativeSignalPrediction[]> {
    const client = this.ensureClient();
    let query = client
      .from('native_signal_predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (marketId) {
      query = query.eq('market_id', marketId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list signal predictions: ${error.message}`);
    }

    return (data as unknown as SupabaseSignalRow[]).map((row) => ({
      id: row.id,
      marketId: row.market_id,
      marketTitle: '',
      marketKind: row.market_kind as NativeSignalPrediction['marketKind'],
      outcomeId: row.outcome_id,
      outcomeLabel: row.outcome_label,
      confidence: Number(row.confidence),
      amount: Number(row.amount),
      rationale: row.rationale ?? undefined,
      trader: (row.wallet_address ?? undefined) as NativeSignalPrediction['trader'],
      createdAt: row.created_at,
    }));
  }

  async saveScalarDistributionPrediction(
    prediction: Omit<ScalarDistributionPrediction, 'id' | 'createdAt'>,
  ): Promise<ScalarDistributionPrediction> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from('scalar_distribution_predictions')
      .insert({
        market_id: prediction.marketId,
        unit: prediction.unit ?? null,
        min_value: prediction.min ?? null,
        max_value: prediction.max ?? null,
        p10: prediction.p10,
        p50: prediction.p50,
        p90: prediction.p90,
        confidence: prediction.confidence,
        rationale: prediction.rationale ?? null,
        wallet_address: prediction.trader ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to save scalar prediction: ${error?.message ?? 'no data returned'}`,
      );
    }

    const row = data as unknown as SupabaseScalarRow;
    return {
      id: row.id,
      marketId: row.market_id,
      marketTitle: prediction.marketTitle,
      unit: row.unit ?? undefined,
      min: row.min_value ?? undefined,
      max: row.max_value ?? undefined,
      p10: Number(row.p10),
      p50: Number(row.p50),
      p90: Number(row.p90),
      confidence: Number(row.confidence),
      rationale: row.rationale ?? undefined,
      trader: (row.wallet_address ?? undefined) as ScalarDistributionPrediction['trader'],
      createdAt: row.created_at,
    };
  }

  async listScalarDistributionPredictions(
    marketId?: string,
  ): Promise<ScalarDistributionPrediction[]> {
    const client = this.ensureClient();
    let query = client
      .from('scalar_distribution_predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (marketId) {
      query = query.eq('market_id', marketId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list scalar predictions: ${error.message}`);
    }

    return (data as unknown as SupabaseScalarRow[]).map((row) => ({
      id: row.id,
      marketId: row.market_id,
      marketTitle: '',
      unit: row.unit ?? undefined,
      min: row.min_value ?? undefined,
      max: row.max_value ?? undefined,
      p10: Number(row.p10),
      p50: Number(row.p50),
      p90: Number(row.p90),
      confidence: Number(row.confidence),
      rationale: row.rationale ?? undefined,
      trader: (row.wallet_address ?? undefined) as ScalarDistributionPrediction['trader'],
      createdAt: row.created_at,
    }));
  }
}

export const supabasePredictionRepository = new SupabasePredictionRepository();

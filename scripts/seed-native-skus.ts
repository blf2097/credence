/**
 * Seed Credence-native SKU content into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node --import tsx scripts/seed-native-skus.ts
 *
 * Or with a .env.local present (Next.js loads it automatically in dev,
 * but for a standalone script you need to load it yourself):
 *   node --env-file=.env.local --import tsx scripts/seed-native-skus.ts
 *
 * This script uses the SERVICE ROLE key, which bypasses RLS.
 * Never expose the service role key in the browser.
 *
 * The script is idempotent: it upserts markets, world models, and evidence
 * by their text primary keys, so re-running after editing JSON content
 * will update rows without creating duplicates.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contentDir = resolve(__dirname, '../src/content/native-skus');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local or as env vars.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function loadJson(filename: string) {
  const raw = readFileSync(resolve(contentDir, filename), 'utf-8');
  return JSON.parse(raw);
}

async function seedMarkets() {
  const markets = loadJson('markets.json');
  console.log(`Seeding ${markets.length} native markets...`);

  for (const market of markets) {
    const row = {
      id: market.id,
      provider: market.provider,
      kind: market.kind,
      settlement_type: market.settlementType,
      title: market.title,
      description: market.description,
      category: market.category ?? null,
      end_date: market.endDate ?? null,
      active: market.active ?? true,
      closed: market.closed ?? false,
      outcomes: market.outcomes,
      metrics: market.metrics ?? {},
      trading: market.trading ?? {},
      source: market.source ?? {},
      tags: market.tags ?? [],
      metadata: {
        ...(market.metadata ?? {}),
        contentSource: 'src/content/native-skus/markets.json',
      },
    };

    const { error } = await supabase
      .from('native_markets')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`  FAIL ${market.id}: ${error.message}`);
    } else {
      console.log(`  OK   ${market.id}`);
    }
  }
}

async function seedWorldModels() {
  const models = loadJson('world-models.json');
  console.log(`\nSeeding ${models.length} world models...`);

  for (const model of models) {
    const row = {
      id: model.id,
      title: model.title,
      thesis: model.thesis,
      confidence: model.confidence,
      horizon: model.horizon ?? null,
      assumptions: model.assumptions ?? [],
      variables: model.variables ?? [],
      prediction_market_ids: model.predictionMarketIds ?? [],
      supporting_evidence_ids: model.supportingEvidenceIds ?? [],
      opposing_evidence_ids: model.opposingEvidenceIds ?? [],
      parent_model_ids: model.parentModelIds ?? [],
      competing_model_ids: model.competingModelIds ?? [],
      metadata: model.metadata ?? {},
    };

    const { error } = await supabase
      .from('world_models')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`  FAIL ${model.id}: ${error.message}`);
    } else {
      console.log(`  OK   ${model.id}`);
    }
  }
}

async function seedEvidence() {
  const evidence = loadJson('evidence.json');
  console.log(`\nSeeding ${evidence.length} evidence nodes...`);

  for (const ev of evidence) {
    const row = {
      id: ev.id,
      title: ev.title,
      source_url: ev.sourceUrl ?? null,
      observed_at: ev.observedAt ?? new Date().toISOString(),
      summary: ev.summary,
      supports_model_ids: ev.supportsModelIds ?? [],
      opposes_model_ids: ev.opposesModelIds ?? [],
      affected_variable_ids: ev.affectedVariableIds ?? [],
      bayes_update: ev.bayesUpdate ?? null,
    };

    const { error } = await supabase
      .from('evidence_nodes')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`  FAIL ${ev.id}: ${error.message}`);
    } else {
      console.log(`  OK   ${ev.id}`);
    }
  }
}

async function main() {
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('---');
  await seedMarkets();
  await seedWorldModels();
  await seedEvidence();
  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

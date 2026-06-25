/**
 * Seed Credence-native SKU content into Supabase.
 *
 * Usage:
 *   pnpm seed:native
 *
 * Reads env vars from .env.local automatically. If Supabase is not configured,
 * runs in validate-only mode (checks JSON content without writing to a database).
 *
 * This script uses the SERVICE ROLE key when available, which bypasses RLS.
 * Never expose the service role key in the browser.
 *
 * The script is idempotent: it upserts markets, world models, and evidence
 * by their text primary keys, so re-running after editing JSON content
 * will update rows without creating duplicates.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contentDir = resolve(__dirname, '../src/content/native-skus');
const envLocalPath = resolve(__dirname, '../.env.local');

// --- Auto-load .env.local so the user doesn't need --env-file ---
if (existsSync(envLocalPath)) {
  const raw = readFileSync(envLocalPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const hasSupabaseConfig =
  supabaseUrl.trim() !== '' && serviceKey.trim() !== '';

function createSupabase() {
  if (!hasSupabaseConfig) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supabase = createSupabase();

function loadJson(filename: string) {
  const raw = readFileSync(resolve(contentDir, filename), 'utf-8');
  return JSON.parse(raw);
}

// --- Validate-only mode (no Supabase) ---

function validateOnly() {
  console.log('Supabase 未配置。运行 validate-only 模式（只检查 JSON 内容，不写入数据库）。\n');
  console.log('如果要写入 Supabase，请在 .env.local 中填写:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL="<your-project-url>"');
  console.log('  SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"');
  console.log('');

  const markets = loadJson('markets.json');
  const models = loadJson('world-models.json');
  const evidence = loadJson('evidence.json');

  console.log(`Markets: ${markets.length}`);
  for (const m of markets) {
    console.log(`  OK   ${m.id} (${m.kind}) — ${m.title.slice(0, 40)}`);
  }

  console.log(`\nWorld models: ${models.length}`);
  for (const wm of models) {
    console.log(`  OK   ${wm.id} — ${wm.title.slice(0, 40)}`);
  }

  console.log(`\nEvidence: ${evidence.length}`);
  for (const ev of evidence) {
    console.log(`  OK   ${ev.id} — ${ev.title.slice(0, 40)}`);
  }

  console.log(`\nValidate-only 完成。共 ${markets.length} markets, ${models.length} models, ${evidence.length} evidence。`);
}

// --- Supabase seed mode ---

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

    const { error } = await supabase!
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

    const { error } = await supabase!
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

    const { error } = await supabase!
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
  if (!hasSupabaseConfig) {
    validateOnly();
    process.exit(0);
  }

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

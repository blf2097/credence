-- Credence native prediction schema
-- Target: Supabase/Postgres. This is not applied automatically yet.

create extension if not exists pgcrypto;

create table if not exists public.credence_users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.native_markets (
  id text primary key,
  provider text not null default 'credence',
  kind text not null check (kind in ('binary', 'categorical', 'scalar', 'world_model')),
  settlement_type text not null check (settlement_type in ('event', 'variable', 'model_score')),
  title text not null,
  description text not null,
  category text,
  end_date timestamptz,
  active boolean not null default true,
  closed boolean not null default false,
  outcomes jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  trading jsonb not null default '{}'::jsonb,
  source jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.native_signal_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.credence_users(id) on delete set null,
  wallet_address text,
  market_id text not null references public.native_markets(id) on delete cascade,
  market_kind text not null,
  outcome_id text not null,
  outcome_label text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 100),
  amount numeric not null default 0,
  rationale text,
  created_at timestamptz not null default now()
);

create table if not exists public.scalar_distribution_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.credence_users(id) on delete set null,
  wallet_address text,
  market_id text not null references public.native_markets(id) on delete cascade,
  unit text,
  min_value numeric,
  max_value numeric,
  p10 numeric not null,
  p50 numeric not null,
  p90 numeric not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 100),
  rationale text,
  created_at timestamptz not null default now(),
  constraint scalar_distribution_order check (p10 <= p50 and p50 <= p90)
);

create table if not exists public.world_models (
  id text primary key,
  title text not null,
  thesis text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  horizon text,
  assumptions jsonb not null default '[]'::jsonb,
  variables jsonb not null default '[]'::jsonb,
  prediction_market_ids text[] not null default '{}',
  supporting_evidence_ids text[] not null default '{}',
  opposing_evidence_ids text[] not null default '{}',
  parent_model_ids text[] not null default '{}',
  competing_model_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_nodes (
  id text primary key,
  title text not null,
  source_url text,
  observed_at timestamptz not null,
  summary text not null,
  supports_model_ids text[] not null default '{}',
  opposes_model_ids text[] not null default '{}',
  affected_variable_ids text[] not null default '{}',
  bayes_update jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.model_updates (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references public.world_models(id) on delete cascade,
  evidence_id text references public.evidence_nodes(id) on delete set null,
  prior numeric not null check (prior >= 0 and prior <= 1),
  posterior numeric not null check (posterior >= 0 and posterior <= 1),
  rationale text not null,
  created_by text not null default 'human',
  created_at timestamptz not null default now()
);

create table if not exists public.belief_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.credence_users(id) on delete cascade,
  wallet_address text,
  market_id text references public.native_markets(id) on delete cascade,
  model_id text references public.world_models(id) on delete cascade,
  belief_type text not null check (belief_type in ('event', 'scalar', 'world_model')),
  confidence numeric check (confidence >= 0 and confidence <= 100),
  latest_prediction_id uuid,
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_native_signal_predictions_market_created
  on public.native_signal_predictions (market_id, created_at desc);

create index if not exists idx_scalar_predictions_market_created
  on public.scalar_distribution_predictions (market_id, created_at desc);

create index if not exists idx_model_updates_model_created
  on public.model_updates (model_id, created_at desc);

create index if not exists idx_belief_portfolio_user
  on public.belief_portfolio_items (user_id, updated_at desc);

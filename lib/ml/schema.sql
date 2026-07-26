-- VASA-EOS-SE-TN — DB-backed ML lifecycle and feedback loop.
create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_type where typname = 'ml_model_status') then create type ml_model_status as enum ('training','candidate','active','deprecated','rolled_back'); end if;
  if not exists (select 1 from pg_type where typname = 'ml_model_type') then create type ml_model_type as enum ('dropout-risk','inspection-priority','scheme-impact'); end if;
  if not exists (select 1 from pg_type where typname = 'ml_drift_type') then create type ml_drift_type as enum ('data','concept','performance'); end if;
end $$;
create table if not exists public.ml_models (id uuid primary key default gen_random_uuid(), model_type ml_model_type not null, version text not null, status ml_model_status not null, metrics jsonb not null default '{}'::jsonb, artifact jsonb not null default '{}'::jsonb, dataset_hash text not null, high_stakes boolean not null default false, promoted_at timestamptz, created_at timestamptz not null default now(), unique(model_type, version));
create unique index if not exists ml_models_one_active_idx on public.ml_models(model_type) where status='active';
create index if not exists ml_models_type_status_idx on public.ml_models(model_type,status,created_at desc);
create table if not exists public.ml_predictions (id uuid primary key default gen_random_uuid(), model_id uuid not null references public.ml_models(id), model_type ml_model_type not null, model_version text not null, input_features jsonb not null, prediction jsonb not null, confidence numeric not null check(confidence >= 0 and confidence <= 1), created_at timestamptz not null default now());
create index if not exists ml_predictions_model_time_idx on public.ml_predictions(model_id, created_at desc);
create index if not exists ml_predictions_type_time_idx on public.ml_predictions(model_type, created_at desc);
create table if not exists public.ml_outcomes (id uuid primary key default gen_random_uuid(), prediction_id uuid not null references public.ml_predictions(id) on delete cascade, actual_outcome jsonb not null, ground_truth_source text not null, observed_at timestamptz not null default now(), unique(prediction_id, ground_truth_source));
create index if not exists ml_outcomes_prediction_idx on public.ml_outcomes(prediction_id, observed_at desc);
create table if not exists public.ml_drift_reports (id uuid primary key default gen_random_uuid(), model_id uuid not null references public.ml_models(id), model_type ml_model_type not null, model_version text not null, drift_type ml_drift_type not null, magnitude numeric not null check(magnitude >= 0), threshold numeric not null check(threshold > 0), severity text not null check(severity in ('none','warning','critical')), detected_at timestamptz not null default now());
create index if not exists ml_drift_model_time_idx on public.ml_drift_reports(model_id, detected_at desc);
create index if not exists ml_drift_type_time_idx on public.ml_drift_reports(model_type, drift_type, detected_at desc);
create table if not exists public.ml_training_runs (id uuid primary key default gen_random_uuid(), model_type ml_model_type not null, version text not null, metrics jsonb not null default '{}'::jsonb, dataset_hash text not null, duration_seconds numeric not null default 0, created_at timestamptz not null default now(), unique(model_type, version, dataset_hash));
create index if not exists ml_training_runs_type_time_idx on public.ml_training_runs(model_type, created_at desc);
create table if not exists public.ml_feature_snapshots (id uuid primary key default gen_random_uuid(), model_type ml_model_type not null, dataset_hash text not null, feature_distributions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(model_type, dataset_hash));
create index if not exists ml_feature_snapshots_type_time_idx on public.ml_feature_snapshots(model_type, created_at desc);

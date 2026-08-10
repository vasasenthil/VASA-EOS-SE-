-- VASA-EOS-SE-TN — durable scheme lifecycle module.

create extension if not exists pgcrypto;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'scheme_status') then
    create type scheme_status as enum ('draft', 'proposed', 'under_review', 'approved', 'active', 'suspended', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'scheme_category') then
    create type scheme_category as enum ('scholarship', 'infrastructure', 'teacher_training', 'mid_day_meal', 'digital_learning', 'inclusive_education', 'sports', 'vocational');
  end if;
end $$;

create table if not exists public.schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category scheme_category not null,
  eligibility text not null,
  budget numeric(14,2) not null check (budget >= 0),
  fiscal_year text not null check (fiscal_year ~ '^\d{4}-\d{2}$'),
  timeline jsonb not null default '{"milestones":[]}'::jsonb,
  status scheme_status not null default 'draft',
  proposed_by text not null,
  approved_by text[] not null default '{}',
  justification text not null,
  expected_outcomes text[] not null default '{}',
  workflow_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheme_proposals (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  proposed_by text not null,
  justification text not null,
  expected_outcomes text[] not null default '{}',
  status scheme_status not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scheme_budgets (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  fiscal_year text not null check (fiscal_year ~ '^\d{4}-\d{2}$'),
  allocated numeric(14,2) not null default 0 check (allocated >= 0),
  released numeric(14,2) not null default 0 check (released >= 0),
  utilized numeric(14,2) not null default 0 check (utilized >= 0),
  balance numeric(14,2) generated always as (allocated - utilized) stored,
  updated_at timestamptz not null default now(),
  unique (scheme_id, fiscal_year),
  constraint scheme_budgets_release_lte_allocated check (released <= allocated),
  constraint scheme_budgets_utilized_lte_released check (utilized <= released)
);

create table if not exists public.scheme_outcomes (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  beneficiaries integer not null default 0 check (beneficiaries >= 0),
  impact_metrics jsonb not null default '{}'::jsonb,
  evaluation text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.scheme_beneficiaries (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  beneficiary_id text not null,
  beneficiary_name text not null,
  benefit_type text not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  district text,
  added_at timestamptz not null default now(),
  unique (scheme_id, beneficiary_id, benefit_type)
);

create table if not exists public.scheme_documents (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  document_name text not null,
  document_type text,
  file_path text not null,
  notes text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists schemes_status_category_idx on public.schemes(status, category);
create index if not exists schemes_workflow_idx on public.schemes(workflow_id);
create index if not exists scheme_budgets_scheme_idx on public.scheme_budgets(scheme_id);
create index if not exists scheme_outcomes_scheme_recorded_idx on public.scheme_outcomes(scheme_id, recorded_at desc);
create index if not exists scheme_beneficiaries_scheme_idx on public.scheme_beneficiaries(scheme_id);

alter table public.schemes enable row level security;
alter table public.scheme_proposals enable row level security;
alter table public.scheme_budgets enable row level security;
alter table public.scheme_outcomes enable row level security;
alter table public.scheme_beneficiaries enable row level security;
alter table public.scheme_documents enable row level security;

drop policy if exists schemes_read_authenticated on public.schemes;
create policy schemes_read_authenticated on public.schemes for select to authenticated using (true);

drop policy if exists schemes_write_secretariat on public.schemes;
create policy schemes_write_secretariat on public.schemes for all to authenticated
  using ((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['SECRETARY','MINISTER','CABINET','ADMIN'])
  with check ((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['SECRETARY','MINISTER','CABINET','ADMIN']);

drop policy if exists scheme_children_read_authenticated on public.scheme_proposals;
create policy scheme_children_read_authenticated on public.scheme_proposals for select to authenticated using (true);

drop policy if exists scheme_budgets_read_authenticated on public.scheme_budgets;
create policy scheme_budgets_read_authenticated on public.scheme_budgets for select to authenticated using (true);

drop policy if exists scheme_outcomes_read_authenticated on public.scheme_outcomes;
create policy scheme_outcomes_read_authenticated on public.scheme_outcomes for select to authenticated using (true);

drop policy if exists scheme_beneficiaries_read_authenticated on public.scheme_beneficiaries;
create policy scheme_beneficiaries_read_authenticated on public.scheme_beneficiaries for select to authenticated using (true);

drop policy if exists scheme_documents_read_authenticated on public.scheme_documents;
create policy scheme_documents_read_authenticated on public.scheme_documents for select to authenticated using (true);

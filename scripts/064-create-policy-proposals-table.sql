-- VASA-EOS(SE) — durable table for policy proposals (full-CRUD module).
--
-- Each row is one policy-as-code proposal: the scheme + scope, the baseline (population, current
-- coverage, unit cost) and the coverage lever (target coverage, equity weighting), plus the
-- sanctioning decision (status, decided_by, sanctioned_budget, notes), keyed by the school's tenant
-- node. The Policy Engine projection (newly-covered, indicative cost, equity note) is DERIVED on
-- read from the baseline + lever — never stored — so it is always reproducible. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.policy_proposals (
  id                     text primary key,
  title                  text not null,
  scheme                 text not null,
  scope                  text not null default 'District',
  population             integer not null default 0,
  baseline_coverage_pct  numeric not null default 0,
  unit_cost              numeric not null default 0,
  target_coverage_pct    numeric not null default 0,
  equity_weighted        boolean not null default false,
  status                 text not null default 'AI Draft',
  decided_by             text not null default '',
  sanctioned_budget      numeric not null default 0,
  notes                  text not null default '',
  tenant_id              text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists policy_proposals_scheme_idx on public.policy_proposals (scheme);
create index if not exists policy_proposals_status_idx on public.policy_proposals (status);

alter table public.policy_proposals enable row level security;

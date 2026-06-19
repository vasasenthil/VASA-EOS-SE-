-- VASA-EOS(SE) — durable table for the Scheme Fund-Flow Ledger (full-CRUD module).
--
-- The platform's LOCAL books for centrally/state-sponsored schemes: per scheme, financial year and
-- tier, the allocated → released → utilised amounts (whole rupees), keyed by the tenant node. PFMS is
-- the national source of truth; the Federation console reconciles each scheme's local figures against
-- PFMS to surface fund-flow drift (potential leakage/mis-posting). Release rate, utilisation and the
-- unspent/unreleased balances are DERIVED on read — never stored — so they are always reproducible.
-- Written through the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.scheme_fund_ledger (
  id              text primary key,
  scheme_code     text not null,
  scheme_name     text not null,
  financial_year  text not null,
  tier            text not null default 'State',
  allocated       numeric not null default 0,
  released        numeric not null default 0,
  utilised        numeric not null default 0,
  as_of           date not null,
  notes           text not null default '',
  tenant_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists scheme_fund_ledger_scheme_idx on public.scheme_fund_ledger (scheme_code);
create index if not exists scheme_fund_ledger_fy_idx on public.scheme_fund_ledger (financial_year);
create index if not exists scheme_fund_ledger_tier_idx on public.scheme_fund_ledger (tier);

alter table public.scheme_fund_ledger enable row level security;

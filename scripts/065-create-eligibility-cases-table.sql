-- VASA-EOS(SE) — durable table for eligibility & compliance cases (full-CRUD module).
--
-- Each row is one case: the subject (applicant/school) + reference, the rule-set category, the facts
-- (JSONB array of {key,value}) and the human decision (decision, decided_by, notes), keyed by the
-- school's tenant node. The Reasoning Engine derivation (which published rules fired, and why) is
-- DERIVED on read from the facts + the category's rule set — never stored — so it is always
-- reproducible and fully auditable. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.eligibility_cases (
  id          text primary key,
  subject     text not null,
  reference   text not null default '',
  category    text not null,
  facts       jsonb not null default '[]'::jsonb,
  decision    text not null default 'AI Draft',
  decided_by  text not null default '',
  notes       text not null default '',
  tenant_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists eligibility_cases_category_idx on public.eligibility_cases (category);
create index if not exists eligibility_cases_decision_idx on public.eligibility_cases (decision);

alter table public.eligibility_cases enable row level security;

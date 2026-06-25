-- VASA-EOS(SE) — durable table for the scholarship / benefit sanction vertical.
--
-- Each application carries a live SCHOLARSHIP_SANCTION workflow instance (Headmaster
-- verify -> BEO sanction -> DEO scrutiny for >= ₹25,000 -> DBT release) plus the rich
-- intake from the application form (category, income, attendance, masked DBT account,
-- AI-eligibility verdict). Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default — these rows carry beneficiary PII; the
-- trusted service-role bypasses RLS and performs the app's own scoping.

create table if not exists public.scholarship_flows (
  id          text primary key,
  student     text not null,
  scheme      text not null,
  amount      numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists scholarship_flows_created_idx on public.scholarship_flows (created_at desc);

alter table public.scholarship_flows enable row level security;

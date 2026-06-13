-- VASA-EOS(SE) — durable table for the RBSK health-referral vertical.
--
-- Each referral carries a live HEALTH_REFERRAL workflow instance (School verify -> Block
-- Medical Officer -> District DEIC specialist for referral cases) plus the rich screening
-- detail (class, severity, screening date, findings, masked guardian contact, triage).
-- These rows are sensitive child-health PII: RLS is enabled deny-by-default, so only the
-- trusted service-role (which performs the app's own scoping) can read them.

create table if not exists public.health_flows (
  id                  text primary key,
  student             text not null,
  category            text not null,
  specialist_referral boolean not null default false,
  instance            jsonb not null default '{}'::jsonb,
  details             jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists health_flows_created_idx on public.health_flows (created_at desc);

alter table public.health_flows enable row level security;

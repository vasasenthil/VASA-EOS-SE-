-- VASA-EOS(SE) — durable table for the Budget sanction / re-appropriation vertical.
--
-- Each proposal carries a live BUDGET_SANCTION workflow instance (Directorate proposal ->
-- Secretariat & Finance scrutiny -> Cabinet / Minister approval for new schemes and high-value
-- sanctions) plus the rich intake (proposal type, budget head, source head, fiscal year,
-- justification). Written through the service-role client when configured; in-memory otherwise.
-- RLS enabled deny-by-default.

create table if not exists public.budget_flows (
  id          text primary key,
  scheme      text not null,
  amount      numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists budget_flows_created_idx on public.budget_flows (created_at desc);

alter table public.budget_flows enable row level security;

-- VASA-EOS(SE) — durable table for the infrastructure works sanction vertical.
--
-- Each proposal carries a live INFRA_WORKS workflow instance (Headmaster estimate -> Block
-- technical scrutiny -> District sanction -> Directorate approval for high-value works) plus
-- the rich intake (funding source, justification, RTE/RPwD-mandated flag). Written through the
-- service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.infra_flows (
  id          text primary key,
  school      text not null,
  work_type   text not null,
  cost        numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists infra_flows_created_idx on public.infra_flows (created_at desc);

alter table public.infra_flows enable row level security;

-- VASA-EOS(SE) — durable table for the GeM procurement vertical.
--
-- Each indent carries a live GEM_PROCUREMENT workflow instance (Headmaster estimate -> Block
-- verification -> District financial sanction -> Directorate approval for tenders) plus the rich
-- intake (quantity, funding head, justification, GeM/GFR purchase mode). Written through the
-- service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.procurement_flows (
  id          text primary key,
  item        text not null,
  category    text not null,
  cost        numeric,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists procurement_flows_created_idx on public.procurement_flows (created_at desc);

alter table public.procurement_flows enable row level security;

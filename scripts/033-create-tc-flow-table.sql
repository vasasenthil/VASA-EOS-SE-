-- VASA-EOS(SE) — durable table for the Transfer Certificate (TC) issuance vertical.
--
-- Each request carries a live TC_ISSUANCE workflow instance (Class Teacher academic record & dues
-- clearance -> Headmaster issues & signs -> Block counter-signature for inter-state / duplicate)
-- plus the rich intake (APAAR id, UDISE code, class last studied, certificate type, reason, date of
-- leaving, dues-cleared). Written through the service-role client when configured; in-memory
-- otherwise. RLS enabled deny-by-default.

create table if not exists public.tc_flows (
  id          text primary key,
  student     text not null,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists tc_flows_created_idx on public.tc_flows (created_at desc);

alter table public.tc_flows enable row level security;

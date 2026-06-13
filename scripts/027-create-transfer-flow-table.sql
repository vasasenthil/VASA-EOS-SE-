-- VASA-EOS(SE) — durable table for the teacher transfer & counselling vertical.
--
-- Each request carries a live TRANSFER_REQUEST workflow instance (Headmaster NOC -> BEO
-- recommendation -> DEO counselling/order -> Directorate sanction for inter-district moves)
-- plus the rich intake (current/requested posting, reason, years of service, eligibility).
-- Written through the service-role client when configured; in-memory otherwise. RLS is
-- enabled deny-by-default; the trusted service-role performs the app's own scoping.

create table if not exists public.transfer_flows (
  id              text primary key,
  teacher         text not null,
  inter_district  boolean not null default false,
  instance        jsonb not null default '{}'::jsonb,
  details         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists transfer_flows_created_idx on public.transfer_flows (created_at desc);

alter table public.transfer_flows enable row level security;

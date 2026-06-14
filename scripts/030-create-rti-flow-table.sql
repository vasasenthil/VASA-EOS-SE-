-- VASA-EOS(SE) — durable table for the RTI request vertical.
--
-- Each request carries a live RTI_REQUEST workflow instance (PIO -> First Appellate Authority
-- -> State Information Commission) plus the rich intake (category, information sought, fee, BPL
-- exemption, expedite flag, deadline). Written through the service-role client when configured;
-- in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.rti_flows (
  id          text primary key,
  applicant   text not null,
  subject     text not null,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists rti_flows_created_idx on public.rti_flows (created_at desc);

alter table public.rti_flows enable row level security;

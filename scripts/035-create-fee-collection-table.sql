-- VASA-EOS(SE) — durable table for monthly fee-collection snapshots.
--
-- Backs the Principal dashboard's "Fee Collection" card with live data: each row is one
-- school-month snapshot (billed, collected, defaulters, RTE free-seat students), keyed by the
-- school's 11-digit UDISE code. The store returns the latest period per school, so saving a new
-- month supersedes the card figure while preserving history. Written through the service-role
-- client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.fee_collection (
  id           text primary key,
  udise_code   text not null,
  month        text not null,
  period       text not null,
  billed       bigint not null,
  collected    bigint not null,
  defaulters   integer not null,
  rte_students integer not null,
  tenant_id    text,
  created_at   timestamptz not null default now()
);

create index if not exists fee_collection_school_idx on public.fee_collection (udise_code, period desc);

alter table public.fee_collection enable row level security;

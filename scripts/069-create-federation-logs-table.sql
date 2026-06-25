-- VASA-EOS(SE) — durable table for federation reconciliation logs (full-CRUD module).
--
-- Each row records one federated lookup against a national system of record (APAAR / UDISE+ /
-- DIKSHA / PFMS): the source, the lookup key, a summary of the federated record, the gateway mode
-- (mock/live), and the human reconciliation (status Pending → Reconciled / Flagged, reconciled_by,
-- notes), keyed by the school's tenant node. The platform federates — it reads the source of truth
-- and a human reconciles — it never duplicates. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.federation_logs (
  id            text primary key,
  source        text not null,
  source_label  text not null,
  key           text not null,
  summary       text not null default '',
  mode          text not null default 'mock',
  status        text not null default 'Pending',
  reconciled_by text not null default '',
  notes         text not null default '',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists federation_logs_source_idx on public.federation_logs (source);
create index if not exists federation_logs_status_idx on public.federation_logs (status);

alter table public.federation_logs enable row level security;

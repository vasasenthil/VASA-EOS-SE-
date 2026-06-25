-- VASA-EOS(SE) — durable table for the school statutory-compliance checklist.
--
-- Backs the Principal dashboard's "Compliance Checklist" with live data: each row is one statutory
-- obligation (SMC meeting, UDISE+ submission, mid-day meal register, fire-safety drill, health
-- screening, teacher CPD…) with a status, keyed by the school's 11-digit UDISE code. Written
-- through the service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.school_compliance (
  id          text primary key,
  udise_code  text not null,
  item        text not null,
  status      text not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists school_compliance_school_idx on public.school_compliance (udise_code, created_at);

alter table public.school_compliance enable row level security;

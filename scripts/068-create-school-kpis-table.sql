-- VASA-EOS(SE) — durable table for per-school KPI snapshots (multi-tier roll-up; full-CRUD module).
--
-- Each row is one school's KPI snapshot for an academic year: enrolment, attendance %, pass %, fee
-- collection %, at-risk count and compliance gaps, plus its district and block. These roll UP —
-- enrolment-weighted — to block, district and state for evidence-based governance. Keyed by the
-- school's tenant node. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.school_kpis (
  id                  text primary key,
  school_name         text not null,
  udise               text not null,
  district            text not null,
  block               text not null,
  enrolment           integer not null default 0,
  attendance_pct      numeric not null default 0,
  pass_pct            numeric not null default 0,
  fee_collection_pct  numeric not null default 0,
  at_risk_count       integer not null default 0,
  compliance_gaps     integer not null default 0,
  academic_year       text not null,
  tenant_id           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists school_kpis_district_idx on public.school_kpis (district);
create index if not exists school_kpis_block_idx on public.school_kpis (block);
create index if not exists school_kpis_udise_idx on public.school_kpis (udise);

alter table public.school_kpis enable row level security;

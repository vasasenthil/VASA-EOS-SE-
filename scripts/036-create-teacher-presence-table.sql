-- VASA-EOS(SE) — durable table for daily teacher-presence snapshots.
--
-- Backs the Principal dashboard's "Teachers Present" KPI with live data: each row is one
-- school-day snapshot (present out of total teaching strength), keyed by the school's 11-digit
-- UDISE code. The store returns the latest day per school. Written through the service-role client
-- when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.teacher_presence (
  id          text primary key,
  udise_code  text not null,
  on_date     date not null,
  present     integer not null,
  total       integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists teacher_presence_school_idx on public.teacher_presence (udise_code, on_date desc);

alter table public.teacher_presence enable row level security;

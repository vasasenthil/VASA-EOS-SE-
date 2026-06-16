-- VASA-EOS(SE) — durable table for student enrolment snapshots.
--
-- Backs the Principal dashboard's "Total Students" KPI with live data: each row is one school
-- point-in-time roll (total, boys, girls — for gender parity), keyed by the school's 11-digit
-- UDISE code. The store returns the latest snapshot per school. Written through the service-role
-- client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.enrolment_snapshots (
  id          text primary key,
  udise_code  text not null,
  as_of       date not null,
  total       integer not null,
  boys        integer not null,
  girls       integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists enrolment_snapshots_school_idx on public.enrolment_snapshots (udise_code, as_of desc);

alter table public.enrolment_snapshots enable row level security;

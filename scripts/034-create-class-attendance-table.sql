-- VASA-EOS(SE) — durable table for class-wise daily attendance.
--
-- Backs the Principal dashboard's "Today's Attendance" block with live data: each row is one
-- class's enrolled/present count for a day, keyed by the school's 11-digit UDISE code. The store
-- returns the latest record per class, so re-recording supersedes the figure while preserving the
-- audit history. Written through the service-role client when configured; in-memory otherwise.
-- RLS enabled deny-by-default.

create table if not exists public.class_attendance (
  id          text primary key,
  udise_code  text not null,
  cls         text not null,
  enrolled    integer not null,
  present     integer not null,
  on_date     date not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists class_attendance_school_idx on public.class_attendance (udise_code, on_date desc);

alter table public.class_attendance enable row level security;

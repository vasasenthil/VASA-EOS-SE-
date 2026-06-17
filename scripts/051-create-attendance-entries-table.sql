-- VASA-EOS(SE) — durable table for the attendance register (full-CRUD module).
--
-- Each row is one student's attendance on one date: Present / Absent / Late / Leave, by class and
-- section, with an optional remark, keyed by the school's tenant node. Complements the daily
-- marking sheet with a queryable register. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.attendance_entries (
  id           text primary key,
  student      text not null,
  apaar_id     text not null default '',
  class_level  text not null,
  section      text not null default 'A',
  date         date not null,
  status       text not null default 'Present',
  remarks      text not null default '',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists attendance_entries_date_idx on public.attendance_entries (date);
create index if not exists attendance_entries_class_section_idx on public.attendance_entries (class_level, section);
create index if not exists attendance_entries_status_idx on public.attendance_entries (status);

alter table public.attendance_entries enable row level security;

-- VASA-EOS(SE) — durable table for the timetable manager (full-CRUD module).
--
-- Each row is one period in the weekly timetable: class/section, day, period, time window, subject,
-- teacher and room, keyed by the school's tenant node. Clash detection (a class or teacher can't be
-- double-booked in the same day+period) is enforced in the server action. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.timetable_entries (
  id           text primary key,
  class_level  text not null,
  section      text not null default 'A',
  day          text not null,
  period       integer not null,
  start_time   text not null,
  end_time     text not null,
  subject      text not null,
  teacher      text not null,
  room         text not null default '',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists timetable_entries_class_section_idx on public.timetable_entries (class_level, section);
create index if not exists timetable_entries_day_period_idx on public.timetable_entries (day, period);
create index if not exists timetable_entries_teacher_idx on public.timetable_entries (teacher);

alter table public.timetable_entries enable row level security;

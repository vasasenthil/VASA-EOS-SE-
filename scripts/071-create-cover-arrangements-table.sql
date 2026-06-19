-- VASA-EOS(SE) — durable table for the substitute / cover arrangement register (full-CRUD module).
--
-- When a teacher is absent, every one of their periods must be covered. Each row is one uncovered
-- period for a class on a date — the absent teacher, the reason, the slot (class/section/period),
-- the subject, the assigned substitute (if any) and the status (Pending → Assigned → Completed),
-- keyed by the school's tenant node. Substitute SUGGESTIONS are derived live from the timetable
-- (teachers free in that exact day+period) — never stored — so they always reflect the current
-- roster. Written through the service-role client when configured; in-memory otherwise. RLS
-- deny-by-default.

create table if not exists public.cover_arrangements (
  id                  text primary key,
  date                date not null,
  absent_teacher      text not null,
  reason              text not null default 'Casual Leave',
  class_level         text not null,
  section             text not null default 'A',
  period              integer not null default 1,
  subject             text not null,
  substitute_teacher  text not null default '',
  status              text not null default 'Pending',
  notes               text not null default '',
  tenant_id           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists cover_arrangements_date_idx on public.cover_arrangements (date);
create index if not exists cover_arrangements_status_idx on public.cover_arrangements (status);
create index if not exists cover_arrangements_slot_idx on public.cover_arrangements (class_level, section, period);

alter table public.cover_arrangements enable row level security;

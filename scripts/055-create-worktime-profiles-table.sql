-- VASA-EOS(SE) — durable table for the working-time scheduler (full-CRUD module).
--
-- Each row is one academic-year working-time profile: term window, working weekdays (JSONB int
-- array), daily start/end and the daily bell-schedule (JSONB array of {label,kind,startTime,
-- endTime}), with a Draft/Active status, keyed by the school's tenant node. Combined with the
-- Holiday Calendar it resolves real school days. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.worktime_profiles (
  id                text primary key,
  name              text not null,
  academic_year     text not null,
  term_start        date not null,
  term_end          date not null,
  working_weekdays  jsonb not null default '[1,2,3,4,5,6]'::jsonb,
  day_start         text not null,
  day_end           text not null,
  periods           jsonb not null default '[]'::jsonb,
  status            text not null default 'Draft',
  tenant_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists worktime_profiles_year_idx on public.worktime_profiles (academic_year);
create index if not exists worktime_profiles_status_idx on public.worktime_profiles (status);

alter table public.worktime_profiles enable row level security;

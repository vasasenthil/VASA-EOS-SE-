-- VASA-EOS(SE) — durable table for the categorised holiday calendar (full-CRUD module).
--
-- Each row is one holiday: name, category (National/State/Restricted/Local/Optional/Exam Break/
-- Vacation/Special), an inclusive date range, a recurring-annual flag (fixed-date festivals), the
-- academic year and a Confirmed/Tentative status, keyed by the school's tenant node. The
-- Working-Time Scheduler reads this calendar to compute non-working/working days. Written through
-- the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.holidays (
  id            text primary key,
  name          text not null,
  category      text not null default 'Special',
  start_date    date not null,
  end_date      date not null,
  recurring     boolean not null default false,
  academic_year text not null,
  description   text not null default '',
  status        text not null default 'Confirmed',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists holidays_year_idx on public.holidays (academic_year);
create index if not exists holidays_category_idx on public.holidays (category);
create index if not exists holidays_start_idx on public.holidays (start_date);

alter table public.holidays enable row level security;

-- VASA-EOS(SE) — durable table for the school assessment schedule.
--
-- Backs the Principal dashboard's "Upcoming Assessments" block with live data: each row is one
-- planned assessment (subject, class, type, date label, status), keyed by the school's 11-digit
-- UDISE code. Written through the service-role client when configured; in-memory otherwise. RLS
-- enabled deny-by-default.

create table if not exists public.assessment_schedule (
  id          text primary key,
  udise_code  text not null,
  subject     text not null,
  cls         text not null,
  type        text not null,
  date        text not null,
  status      text not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists assessment_schedule_school_idx on public.assessment_schedule (udise_code, created_at);

alter table public.assessment_schedule enable row level security;

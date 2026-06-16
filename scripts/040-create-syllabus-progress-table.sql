-- VASA-EOS(SE) — durable table for subject-wise syllabus completion.
--
-- Backs the Principal dashboard's "Syllabus Completion" radar with live data: each row is one
-- subject's teaching-portion percentage and the assigned teacher, keyed by the school's 11-digit
-- UDISE code. Written through the service-role client when configured; in-memory otherwise. RLS
-- enabled deny-by-default.

create table if not exists public.syllabus_progress (
  id          text primary key,
  udise_code  text not null,
  subject     text not null,
  teacher     text not null,
  pct         integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists syllabus_progress_school_idx on public.syllabus_progress (udise_code, created_at);

alter table public.syllabus_progress enable row level security;

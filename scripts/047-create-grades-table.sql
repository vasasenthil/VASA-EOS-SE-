-- VASA-EOS(SE) — durable table for the gradebook (full-CRUD module).
--
-- Each row is one student's marks in one assessment of one subject, for a term, with a Draft/
-- Published status, keyed by the school's tenant node. Percentage and letter grade are derived on
-- read (not stored). Written through the service-role client when configured; in-memory otherwise.
-- RLS deny-by-default.

create table if not exists public.grades (
  id           text primary key,
  student      text not null,
  apaar_id     text not null default '',
  class_level  text not null,
  subject      text not null,
  term         text not null,
  assessment   text not null,
  marks        integer not null default 0,
  max_marks    integer not null default 100,
  status       text not null default 'Draft',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists grades_class_subject_idx on public.grades (class_level, subject);
create index if not exists grades_status_idx on public.grades (status);

alter table public.grades enable row level security;

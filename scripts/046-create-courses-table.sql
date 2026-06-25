-- VASA-EOS(SE) — durable table for the academic course catalogue (full-CRUD module).
--
-- Each row is one course offered by a school: code, name, class level, subject area, teacher,
-- credits and a lifecycle status (Active / Draft / Archived), keyed by the school's tenant node.
-- Written through the service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.courses (
  id           text primary key,
  code         text not null,
  name         text not null,
  class_level  text not null,
  subject_area text not null,
  description  text not null default '',
  credits      integer not null default 4,
  teacher      text not null default '',
  status       text not null default 'Draft',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses (status);
create index if not exists courses_class_idx on public.courses (class_level);

alter table public.courses enable row level security;

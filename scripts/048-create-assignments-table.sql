-- VASA-EOS(SE) — durable table for assignments (full-CRUD module).
--
-- Each row is a teacher-set assignment (homework, project, worksheet, reading, lab) for a class +
-- subject, with a due date, max marks, instructions and a Draft/Assigned/Closed status, keyed by
-- the school's tenant node. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.assignments (
  id            text primary key,
  title         text not null,
  class_level   text not null,
  subject       text not null,
  type          text not null,
  due_date      date not null,
  max_marks     integer not null default 20,
  instructions  text not null default '',
  teacher       text not null default '',
  status        text not null default 'Draft',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists assignments_class_subject_idx on public.assignments (class_level, subject);
create index if not exists assignments_status_idx on public.assignments (status);

alter table public.assignments enable row level security;

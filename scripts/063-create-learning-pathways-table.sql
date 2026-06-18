-- VASA-EOS(SE) — durable table for adaptive learning pathways (full-CRUD module).
--
-- Each row is one learner's adaptive pathway for a subject: the objectives (JSONB array of {id,
-- label, prereqs, mastery}), the mastery threshold, and the human-decided pathway plan (status,
-- approved_by, plan notes), keyed by the school's tenant node. The Personalisation Engine
-- recommendation (next-ready objectives) is DERIVED on read from the objectives — never stored — so
-- it is always reproducible. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.learning_pathways (
  id           text primary key,
  student      text not null,
  apaar_id     text not null default '',
  class_level  text not null,
  section      text not null default 'A',
  subject      text not null,
  title        text not null,
  objectives   jsonb not null default '[]'::jsonb,
  threshold    integer not null default 70,
  plan_status  text not null default 'AI Draft',
  approved_by  text not null default '',
  plan         text not null default '',
  tenant_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists learning_pathways_student_idx on public.learning_pathways (student);
create index if not exists learning_pathways_subject_idx on public.learning_pathways (subject);
create index if not exists learning_pathways_plan_idx on public.learning_pathways (plan_status);

alter table public.learning_pathways enable row level security;

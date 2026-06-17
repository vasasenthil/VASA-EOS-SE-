-- VASA-EOS(SE) — durable table for rich per-period lesson plans (full-CRUD module).
--
-- Each row is one class session's lesson plan: scheduling (class/section, subject, teacher, date,
-- period, time window), pedagogy (lesson type, topic, objectives, previous/further topics as JSONB
-- arrays) and resources (materials-to-bring array, homework, lesson-planner link, class notes as a
-- JSONB array of {kind,title,url}), with a Draft/Planned/Delivered status, keyed by the school's
-- tenant node. Written through the service-role client when configured; in-memory otherwise.
-- RLS deny-by-default.

create table if not exists public.lesson_plans (
  id                   text primary key,
  class_level          text not null,
  section              text not null default 'A',
  subject              text not null,
  teacher              text not null,
  date                 date not null,
  period               integer not null,
  start_time           text not null,
  end_time             text not null,
  lesson_type          text not null default 'Theory',
  topic                text not null,
  objectives           text not null default '',
  previous_topics      jsonb not null default '[]'::jsonb,
  further_topics       jsonb not null default '[]'::jsonb,
  materials_to_bring   jsonb not null default '[]'::jsonb,
  homework             text not null default '',
  lesson_planner_link  text not null default '',
  class_notes          jsonb not null default '[]'::jsonb,
  status               text not null default 'Draft',
  tenant_id            text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists lesson_plans_class_section_idx on public.lesson_plans (class_level, section);
create index if not exists lesson_plans_date_idx on public.lesson_plans (date);
create index if not exists lesson_plans_subject_idx on public.lesson_plans (subject);

alter table public.lesson_plans enable row level security;

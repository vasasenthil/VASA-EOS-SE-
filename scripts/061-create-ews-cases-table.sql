-- VASA-EOS(SE) — durable table for early-warning cases (the human-in-the-loop record).
--
-- The AI risk model + Analytics Engine flag at-risk students (advisory, derived at read time, not
-- stored). When a HUMAN acts, they open a case here and move it Open → Acknowledged → Resolved with
-- an assignee and intervention notes — the durable record that AI assists but humans decide. Keyed
-- by the school's tenant node. Written through the service-role client when configured; in-memory
-- otherwise. RLS deny-by-default.

create table if not exists public.ews_cases (
  id            text primary key,
  student       text not null,
  apaar_id      text not null default '',
  class_level   text not null default '',
  section       text not null default '',
  risk_level    text not null default 'Medium',
  score         integer not null default 0,
  factors       text not null default '',
  status        text not null default 'Open',
  assignee      text not null default '',
  intervention  text not null default '',
  opened_by     text not null default '',
  tenant_id     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ews_cases_status_idx on public.ews_cases (status);
create index if not exists ews_cases_student_idx on public.ews_cases (student);

alter table public.ews_cases enable row level security;

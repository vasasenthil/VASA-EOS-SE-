-- VASA-EOS(SE) — durable table for diagnostic assessments + remediation plans (full-CRUD module).
--
-- Each row is one learner's diagnostic: identity (student, class/section, subject), the assessment
-- title/type/date, the rubric (JSONB array of {id,objective,marks,awarded}) and the human-decided
-- remediation plan (status, approved_by, remediation notes), keyed by the school's tenant node.
-- The Assessment Engine diagnosis (per-objective mastery, weak objectives, band) is DERIVED on read
-- from the rubric — never stored — so it is always reproducible and explainable. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.diagnostics (
  id               text primary key,
  student          text not null,
  apaar_id         text not null default '',
  class_level      text not null,
  section          text not null default 'A',
  subject          text not null,
  title            text not null,
  assessment_type  text not null default 'Diagnostic',
  date             date not null,
  items            jsonb not null default '[]'::jsonb,
  plan_status      text not null default 'AI Draft',
  approved_by      text not null default '',
  remediation      text not null default '',
  tenant_id        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists diagnostics_student_idx on public.diagnostics (student);
create index if not exists diagnostics_subject_idx on public.diagnostics (subject);
create index if not exists diagnostics_plan_idx on public.diagnostics (plan_status);

alter table public.diagnostics enable row level security;

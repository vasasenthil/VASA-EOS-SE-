-- VASA-EOS(SE) — durable table for the student master register / SIS (full-CRUD module).
--
-- Each row is one student: APAAR id, name, demographics, class/section, guardian and contact, with
-- an enrolment lifecycle status, keyed by the school's tenant node. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.students (
  id             text primary key,
  apaar_id       text not null,
  name           text not null,
  gender         text not null,
  dob            date not null,
  class_level    text not null,
  section        text not null default 'A',
  category       text not null,
  guardian_name  text not null default '',
  contact_phone  text not null default '',
  status         text not null default 'Enrolled',
  tenant_id      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists students_class_section_idx on public.students (class_level, section);
create index if not exists students_status_idx on public.students (status);
create index if not exists students_apaar_idx on public.students (apaar_id);

alter table public.students enable row level security;

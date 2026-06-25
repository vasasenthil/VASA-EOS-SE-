-- VASA-EOS(SE) — durable tables for the operational school modules.
--
-- These tables back the interactive operational stores (Safety, CWSN, Discipline,
-- visitors, water tests, drills, library, MDM, notices, and many more). Their
-- stores write through the Supabase service-role client when configured, but no
-- migration created the tables — so in production every insert silently fell back
-- to in-memory. This closes that durability gap.
--
-- Data columns are jsonb: the stores carry heterogeneous values (strings, numbers,
-- booleans, arrays) and read them straight back, so jsonb round-trips them
-- faithfully with no risk of an insert being rejected on a type mismatch. id is
-- the text primary key; created_at orders the listings.
--
-- Tenant-scoped tables (most) carry tenant_id and get the SAME tenant_isolation
-- RLS policy migration 019 already declared for them (public.in_tenant_subtree),
-- enforcing ReBAC downward governance at the database layer. The few non-scoped
-- tables get RLS enabled deny-by-default (service-role only), matching scripts/021.

-- ---- Tenant-scoped operational tables ----

create table if not exists public.alumni (
  id          text primary key,
  name        jsonb,
  batch_year  jsonb,
  occupation  jsonb,
  contact     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists alumni_created_idx on public.alumni (created_at desc);
alter table public.alumni enable row level security;
drop policy if exists tenant_isolation on public.alumni;
create policy tenant_isolation on public.alumni for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.assemblies (
  id          text primary key,
  date        jsonb,
  cls         jsonb,
  theme       jsonb,
  conducted_by jsonb,
  thought     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists assemblies_created_idx on public.assemblies (created_at desc);
alter table public.assemblies enable row level security;
drop policy if exists tenant_isolation on public.assemblies;
create policy tenant_isolation on public.assemblies for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.bagless_activities (
  id          text primary key,
  title       jsonb,
  type        jsonb,
  date        jsonb,
  class_group jsonb,
  participants jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists bagless_activities_created_idx on public.bagless_activities (created_at desc);
alter table public.bagless_activities enable row level security;
drop policy if exists tenant_isolation on public.bagless_activities;
create policy tenant_isolation on public.bagless_activities for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.bank_accounts (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  balance     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists bank_accounts_created_idx on public.bank_accounts (created_at desc);
alter table public.bank_accounts enable row level security;
drop policy if exists tenant_isolation on public.bank_accounts;
create policy tenant_isolation on public.bank_accounts for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cadets (
  id          text primary key,
  name        jsonb,
  cls         jsonb,
  wing        jsonb,
  service_hours jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cadets_created_idx on public.cadets (created_at desc);
alter table public.cadets enable row level security;
drop policy if exists tenant_isolation on public.cadets;
create policy tenant_isolation on public.cadets for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cctv_cameras (
  id          text primary key,
  location    jsonb,
  zone        jsonb,
  working     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cctv_cameras_created_idx on public.cctv_cameras (created_at desc);
alter table public.cctv_cameras enable row level security;
drop policy if exists tenant_isolation on public.cctv_cameras;
create policy tenant_isolation on public.cctv_cameras for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.certificates (
  id          text primary key,
  ref         jsonb,
  type        jsonb,
  student_apaar jsonb,
  student_name jsonb,
  issued_on   jsonb,
  remarks     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists certificates_created_idx on public.certificates (created_at desc);
alter table public.certificates enable row level security;
drop policy if exists tenant_isolation on public.certificates;
create policy tenant_isolation on public.certificates for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.competition_entries (
  id          text primary key,
  student     jsonb,
  event       jsonb,
  level       jsonb,
  medal       jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists competition_entries_created_idx on public.competition_entries (created_at desc);
alter table public.competition_entries enable row level security;
drop policy if exists tenant_isolation on public.competition_entries;
create policy tenant_isolation on public.competition_entries for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cooks (
  id          text primary key,
  name        jsonb,
  role        jsonb,
  honorarium  jsonb,
  present     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cooks_created_idx on public.cooks (created_at desc);
alter table public.cooks enable row level security;
drop policy if exists tenant_isolation on public.cooks;
create policy tenant_isolation on public.cooks for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.council_candidates (
  id          text primary key,
  name        jsonb,
  cls         jsonb,
  position    jsonb,
  votes       jsonb,
  elected     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists council_candidates_created_idx on public.council_candidates (created_at desc);
alter table public.council_candidates enable row level security;
drop policy if exists tenant_isolation on public.council_candidates;
create policy tenant_isolation on public.council_candidates for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.cwsn_students (
  id          text primary key,
  name        jsonb,
  cls         jsonb,
  disability  jsonb,
  supports    jsonb,
  iep_goal    jsonb,
  reviewed    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists cwsn_students_created_idx on public.cwsn_students (created_at desc);
alter table public.cwsn_students enable row level security;
drop policy if exists tenant_isolation on public.cwsn_students;
create policy tenant_isolation on public.cwsn_students for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.diagnostic_rounds (
  id          text primary key,
  date        jsonb,
  label       jsonb,
  scores      jsonb,
  summary     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists diagnostic_rounds_created_idx on public.diagnostic_rounds (created_at desc);
alter table public.diagnostic_rounds enable row level security;
drop policy if exists tenant_isolation on public.diagnostic_rounds;
create policy tenant_isolation on public.diagnostic_rounds for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.drills (
  id          text primary key,
  type        jsonb,
  date        jsonb,
  evac_time_sec jsonb,
  participants jsonb,
  observations jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists drills_created_idx on public.drills (created_at desc);
alter table public.drills enable row level security;
drop policy if exists tenant_isolation on public.drills;
create policy tenant_isolation on public.drills for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.eco_activities (
  id          text primary key,
  title       jsonb,
  type        jsonb,
  saplings    jsonb,
  survived    jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists eco_activities_created_idx on public.eco_activities (created_at desc);
alter table public.eco_activities enable row level security;
drop policy if exists tenant_isolation on public.eco_activities;
create policy tenant_isolation on public.eco_activities for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.excursions (
  id          text primary key,
  destination jsonb,
  date        jsonb,
  class_group jsonb,
  strength    jsonb,
  consents_received jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists excursions_created_idx on public.excursions (created_at desc);
alter table public.excursions enable row level security;
drop policy if exists tenant_isolation on public.excursions;
create policy tenant_isolation on public.excursions for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.fitness_records (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  test        jsonb,
  score       jsonb,
  grade       jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists fitness_records_created_idx on public.fitness_records (created_at desc);
alter table public.fitness_records enable row level security;
drop policy if exists tenant_isolation on public.fitness_records;
create policy tenant_isolation on public.fitness_records for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.guest_lectures (
  id          text primary key,
  speaker     jsonb,
  topic       jsonb,
  org         jsonb,
  domain      jsonb,
  date        jsonb,
  audience    jsonb,
  cls         jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists guest_lectures_created_idx on public.guest_lectures (created_at desc);
alter table public.guest_lectures enable row level security;
drop policy if exists tenant_isolation on public.guest_lectures;
create policy tenant_isolation on public.guest_lectures for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.homework (
  id          text primary key,
  subject     jsonb,
  title       jsonb,
  due_date    jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists homework_created_idx on public.homework (created_at desc);
alter table public.homework enable row level security;
drop policy if exists tenant_isolation on public.homework;
create policy tenant_isolation on public.homework for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.ict_sessions (
  id          text primary key,
  cls         jsonb,
  subject     jsonb,
  date        jsonb,
  students    jsonb,
  devices_working jsonb,
  devices_total jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists ict_sessions_created_idx on public.ict_sessions (created_at desc);
alter table public.ict_sessions enable row level security;
drop policy if exists tenant_isolation on public.ict_sessions;
create policy tenant_isolation on public.ict_sessions for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.incidents (
  id          text primary key,
  student     jsonb,
  type        jsonb,
  severity    jsonb,
  action      jsonb,
  date        jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists incidents_created_idx on public.incidents (created_at desc);
alter table public.incidents enable row level security;
drop policy if exists tenant_isolation on public.incidents;
create policy tenant_isolation on public.incidents for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.loans (
  id          text primary key,
  book_id     jsonb,
  book_title  jsonb,
  borrower    jsonb,
  issued_on   jsonb,
  due_on      jsonb,
  returned_on jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists loans_created_idx on public.loans (created_at desc);
alter table public.loans enable row level security;
drop policy if exists tenant_isolation on public.loans;
create policy tenant_isolation on public.loans for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.lost_found (
  id          text primary key,
  name        jsonb,
  description jsonb,
  location    jsonb,
  reported_by jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists lost_found_created_idx on public.lost_found (created_at desc);
alter table public.lost_found enable row level security;
drop policy if exists tenant_isolation on public.lost_found;
create policy tenant_isolation on public.lost_found for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.mdm_register (
  id          text primary key,
  date        jsonb,
  enrolment   jsonb,
  present     jsonb,
  meals_served jsonb,
  menu        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists mdm_register_created_idx on public.mdm_register (created_at desc);
alter table public.mdm_register enable row level security;
drop policy if exists tenant_isolation on public.mdm_register;
create policy tenant_isolation on public.mdm_register for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.notices (
  id          text primary key,
  title       jsonb,
  body        jsonb,
  category    jsonb,
  audience    jsonb,
  date        jsonb,
  pinned      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists notices_created_idx on public.notices (created_at desc);
alter table public.notices enable row level security;
drop policy if exists tenant_isolation on public.notices;
create policy tenant_isolation on public.notices for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.oosc_children (
  id          text primary key,
  name        jsonb,
  age         jsonb,
  reason      jsonb,
  status      jsonb,
  target_class jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists oosc_children_created_idx on public.oosc_children (created_at desc);
alter table public.oosc_children enable row level security;
drop policy if exists tenant_isolation on public.oosc_children;
create policy tenant_isolation on public.oosc_children for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.readers (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  level       jsonb,
  books_read  jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists readers_created_idx on public.readers (created_at desc);
alter table public.readers enable row level security;
drop policy if exists tenant_isolation on public.readers;
create policy tenant_isolation on public.readers for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.result_publications (
  id          text primary key,
  date        jsonb,
  exam_name   jsonb,
  candidates  jsonb,
  pass_pct    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists result_publications_created_idx on public.result_publications (created_at desc);
alter table public.result_publications enable row level security;
drop policy if exists tenant_isolation on public.result_publications;
create policy tenant_isolation on public.result_publications for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.rte_applicants (
  id          text primary key,
  name        jsonb,
  category    jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists rte_applicants_created_idx on public.rte_applicants (created_at desc);
alter table public.rte_applicants enable row level security;
drop policy if exists tenant_isolation on public.rte_applicants;
create policy tenant_isolation on public.rte_applicants for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.rti_requests (
  id          text primary key,
  applicant   jsonb,
  subject     jsonb,
  received_date jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists rti_requests_created_idx on public.rti_requests (created_at desc);
alter table public.rti_requests enable row level security;
drop policy if exists tenant_isolation on public.rti_requests;
create policy tenant_isolation on public.rti_requests for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.safety_concerns (
  id          text primary key,
  category    jsonb,
  description jsonb,
  action      jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists safety_concerns_created_idx on public.safety_concerns (created_at desc);
alter table public.safety_concerns enable row level security;
drop policy if exists tenant_isolation on public.safety_concerns;
create policy tenant_isolation on public.safety_concerns for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.scholarships (
  id          text primary key,
  name        jsonb,
  scheme      jsonb,
  amount      jsonb,
  status      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists scholarships_created_idx on public.scholarships (created_at desc);
alter table public.scholarships enable row level security;
drop policy if exists tenant_isolation on public.scholarships;
create policy tenant_isolation on public.scholarships for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.sf_projects (
  id          text primary key,
  title       jsonb,
  student     jsonb,
  cls         jsonb,
  category    jsonb,
  score       jsonb,
  judged      jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists sf_projects_created_idx on public.sf_projects (created_at desc);
alter table public.sf_projects enable row level security;
drop policy if exists tenant_isolation on public.sf_projects;
create policy tenant_isolation on public.sf_projects for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.sport_results (
  id          text primary key,
  event       jsonb,
  student     jsonb,
  medal       jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists sport_results_created_idx on public.sport_results (created_at desc);
alter table public.sport_results enable row level security;
drop policy if exists tenant_isolation on public.sport_results;
create policy tenant_isolation on public.sport_results for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.staff_attendance_sheets (
  id          text primary key,
  date        jsonb,
  records     jsonb,
  pct         jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists staff_attendance_sheets_created_idx on public.staff_attendance_sheets (created_at desc);
alter table public.staff_attendance_sheets enable row level security;
drop policy if exists tenant_isolation on public.staff_attendance_sheets;
create policy tenant_isolation on public.staff_attendance_sheets for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.tc_requests (
  id          text primary key,
  student     jsonb,
  cls         jsonb,
  reason      jsonb,
  status      jsonb,
  date        jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists tc_requests_created_idx on public.tc_requests (created_at desc);
alter table public.tc_requests enable row level security;
drop policy if exists tenant_isolation on public.tc_requests;
create policy tenant_isolation on public.tc_requests for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.textbook_indents (
  id          text primary key,
  cls         jsonb,
  subject     jsonb,
  required    jsonb,
  received    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists textbook_indents_created_idx on public.textbook_indents (created_at desc);
alter table public.textbook_indents enable row level security;
drop policy if exists tenant_isolation on public.textbook_indents;
create policy tenant_isolation on public.textbook_indents for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.vacancy_lines (
  id          text primary key,
  subject     jsonb,
  sanctioned  jsonb,
  working     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists vacancy_lines_created_idx on public.vacancy_lines (created_at desc);
alter table public.vacancy_lines enable row level security;
drop policy if exists tenant_isolation on public.vacancy_lines;
create policy tenant_isolation on public.vacancy_lines for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.visitors (
  id          text primary key,
  name        jsonb,
  purpose     jsonb,
  meeting     jsonb,
  in_time     jsonb,
  out_time    jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists visitors_created_idx on public.visitors (created_at desc);
alter table public.visitors enable row level security;
drop policy if exists tenant_isolation on public.visitors;
create policy tenant_isolation on public.visitors for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.voc_enrolments (
  id          text primary key,
  student     jsonb,
  trade       jsonb,
  level       jsonb,
  certified   jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists voc_enrolments_created_idx on public.voc_enrolments (created_at desc);
alter table public.voc_enrolments enable row level security;
drop policy if exists tenant_isolation on public.voc_enrolments;
create policy tenant_isolation on public.voc_enrolments for select using (public.in_tenant_subtree(tenant_id));

create table if not exists public.water_tests (
  id          text primary key,
  source      jsonb,
  date        jsonb,
  ph          jsonb,
  result      jsonb,
  remarks     jsonb,
  tenant_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists water_tests_created_idx on public.water_tests (created_at desc);
alter table public.water_tests enable row level security;
drop policy if exists tenant_isolation on public.water_tests;
create policy tenant_isolation on public.water_tests for select using (public.in_tenant_subtree(tenant_id));

-- ---- Non-tenant operational tables (service-role only) ----

create table if not exists public.leave_requests (
  id          text primary key,
  teacher     jsonb,
  type        jsonb,
  from_date   jsonb,
  to_date     jsonb,
  reason      jsonb,
  status      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists leave_requests_created_idx on public.leave_requests (created_at desc);
alter table public.leave_requests enable row level security;

create table if not exists public.maintenance_tickets (
  id          text primary key,
  category    jsonb,
  description jsonb,
  priority    jsonb,
  status      jsonb,
  raised_on   jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists maintenance_tickets_created_idx on public.maintenance_tickets (created_at desc);
alter table public.maintenance_tickets enable row level security;

create table if not exists public.transfers (
  id          text primary key,
  teacher     jsonb,
  from_school jsonb,
  to_school   jsonb,
  reason      jsonb,
  status      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists transfers_created_idx on public.transfers (created_at desc);
alter table public.transfers enable row level security;


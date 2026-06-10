-- VASA-EOS(SE) — durable tables for the workflow-backed deep verticals.
--
-- Each of the six transactional modules (recognition, grievance, admissions,
-- leave, SMC, maintenance) persists one row per case, carrying a live workflow
-- instance (JSONB) plus the rich intake captured by its create form (details
-- JSONB). The app writes through the Supabase service-role client when
-- configured (lib/persistence.getDb) and falls back to an in-memory store
-- otherwise — so these tables make the deep verticals durable the moment a
-- database is provisioned, without any app change.
--
-- Security posture: these rows contain applicant / grievance / staff PII. RLS is
-- enabled with NO permissive policy, so the anon and authenticated roles can read
-- nothing directly. The trusted server identity (service-role) bypasses RLS by
-- design and performs the app's own ReBAC scoping in lib/access/scope-server.
-- These tables are NOT tenant-scoped (only Safety, Discipline and CWSN are today),
-- so no tenant_id column / tenant_isolation policy is added here.

-- 1) School recognition / renewal applications (multi-tier approval).
create table if not exists public.recognition_flows (
  id          text primary key,
  school      text not null,
  district    text,
  type        text not null,            -- new | renewal
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 2) Citizen grievances (escalation workflow).
create table if not exists public.grievance_flows (
  id          text primary key,
  applicant   text not null,
  category    text not null,
  description text,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 3) RTE admission applications (approval workflow).
create table if not exists public.admission_flows (
  id          text primary key,
  name        text not null,
  dob         text,
  gender      text,
  category    text,
  class_name  text,
  details     jsonb,
  apaar_id    text,
  instance    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- 4) Teacher leave applications (Principal -> BEO -> DEO).
create table if not exists public.leave_flows (
  id          text primary key,
  teacher     text not null,
  type        text not null,
  from_date   text,
  to_date     text,
  days        integer,
  reason      text,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 5) SMC resolutions (3-member quorum -> Principal counter-sign).
create table if not exists public.smc_flows (
  id          text primary key,
  title       text not null,
  description text,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- 6) Maintenance tickets (Principal triage -> Vendor -> Principal close).
create table if not exists public.maintenance_flows (
  id          text primary key,
  category    text not null,
  description text,
  priority    text not null default 'medium',
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- Inboxes list newest-first; index the sort key on each.
create index if not exists recognition_flows_created_idx  on public.recognition_flows  (created_at desc);
create index if not exists grievance_flows_created_idx    on public.grievance_flows    (created_at desc);
create index if not exists admission_flows_created_idx     on public.admission_flows     (created_at desc);
create index if not exists leave_flows_created_idx         on public.leave_flows         (created_at desc);
create index if not exists smc_flows_created_idx           on public.smc_flows           (created_at desc);
create index if not exists maintenance_flows_created_idx   on public.maintenance_flows   (created_at desc);

-- Deny-by-default: enable RLS with no permissive policy. Service-role bypasses
-- this and is the only identity that touches these tables in the app today.
do $$
declare
  t text;
  flow_tables text[] := array[
    'recognition_flows','grievance_flows','admission_flows',
    'leave_flows','smc_flows','maintenance_flows'
  ];
begin
  foreach t in array flow_tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

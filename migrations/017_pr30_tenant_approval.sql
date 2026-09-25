-- VASA-EOS(SE) — durable table for student enrolment snapshots.
--
-- Backs the Principal dashboard's "Total Students" KPI with live data: each row is one school
-- point-in-time roll (total, boys, girls — for gender parity), keyed by the school's 11-digit
-- UDISE code. The store returns the latest snapshot per school. Written through the service-role
-- client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.enrolment_snapshots (
  id          text primary key,
  udise_code  text not null,
  as_of       date not null,
  total       integer not null,
  boys        integer not null,
  girls       integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists enrolment_snapshots_school_idx on public.enrolment_snapshots (udise_code, as_of desc);

alter table public.enrolment_snapshots enable row level security;

-- VASA-EOS(SE) — durable table for the dropout-risk register.
--
-- Backs the Principal dashboard's "AI Dropout Risk Alerts" block with live data: each row holds
-- the observable factors per flagged learner (attendance, recent scores, fee default, sibling
-- dropout history); the risk band and explainable triggers are DERIVED on read (advisory, human
-- authority), not stored. Keyed by the school's 11-digit UDISE code. Written through the
-- service-role client when configured; in-memory otherwise. RLS enabled deny-by-default.

create table if not exists public.dropout_risk (
  id               text primary key,
  udise_code       text not null,
  name             text not null,
  cls              text not null,
  absences         integer not null,
  attendance_pct   integer not null,
  recent_score_pct integer not null,
  fee_default      boolean not null default false,
  sibling_dropout  boolean not null default false,
  tenant_id        text,
  created_at       timestamptz not null default now()
);

create index if not exists dropout_risk_school_idx on public.dropout_risk (udise_code, created_at desc);

alter table public.dropout_risk enable row level security;

-- VASA-EOS(SE) — durable table for subject-wise syllabus completion.
--
-- Backs the Principal dashboard's "Syllabus Completion" radar with live data: each row is one
-- subject's teaching-portion percentage and the assigned teacher, keyed by the school's 11-digit
-- UDISE code. Written through the service-role client when configured; in-memory otherwise. RLS
-- enabled deny-by-default.

create table if not exists public.syllabus_progress (
  id          text primary key,
  udise_code  text not null,
  subject     text not null,
  teacher     text not null,
  pct         integer not null,
  tenant_id   text,
  created_at  timestamptz not null default now()
);

create index if not exists syllabus_progress_school_idx on public.syllabus_progress (udise_code, created_at);

alter table public.syllabus_progress enable row level security;

-- Ownership is imported from the authoritative institution registry, never guessed
-- from legacy demo values. Unmapped legacy records remain inaccessible.
create table public.school_tenant_bindings (
 school_id text primary key, udise_code text not null unique check (udise_code ~ '^[0-9]{11}$'),
 tenant_id text not null unique, block_id text, district_id text, state_id text not null,
 verified_at timestamptz not null, verified_by text not null
);
alter table public.school_tenant_bindings enable row level security;
revoke all on public.school_tenant_bindings from public, anon, authenticated;
grant select on public.school_tenant_bindings to service_role;

create or replace function public.validate_school_ownership() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
begin
 if not exists(select 1 from public.school_tenant_bindings s where s.udise_code=new.udise_code and s.tenant_id=new.tenant_id) then
  raise exception 'Verified school ownership required';
 end if;
 return new;
end $$;
revoke all on function public.validate_school_ownership() from public, anon, authenticated;

do $$ declare t text;
begin
 foreach t in array array['enrolment_snapshots','dropout_risk','syllabus_progress'] loop
  if to_regclass('public.'||t) is not null then
   execute format('alter table public.%I alter column tenant_id drop default',t);
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from public, anon, authenticated',t);
   execute format('grant select,insert,update,delete on public.%I to service_role',t);
   execute format('update public.%I r set tenant_id=s.tenant_id from public.school_tenant_bindings s where r.udise_code=s.udise_code and r.tenant_id is distinct from s.tenant_id',t);
   execute format('create trigger verified_school_ownership before insert or update on public.%I for each row execute function public.validate_school_ownership()',t);
  end if;
 end loop;
end $$;

alter table public.schemes add column if not exists jurisdiction_id text;
-- No fabricated jurisdiction on existing schemes: registry owner backfill is required.
do $$ declare t text;
begin
 foreach t in array array['schemes','scheme_proposals','scheme_budgets','scheme_outcomes','scheme_beneficiaries','scheme_documents','workflow_instances'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
end $$;

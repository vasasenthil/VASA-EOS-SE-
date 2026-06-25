-- VASA-EOS(SE) — durable table for outcome instrumentation (TN Quality Index + Opportunity-Gap).
--
-- Each row is one cohort's term outcomes, disaggregated by district, school category, rural/urban,
-- gender, social category and disability (RPwD), with the component metrics (FLN, attendance,
-- transition, pass) 0-100 and a cohort size. The Quality Index and the Opportunity-Gap Index are
-- DERIVED on read (cohort-weighted composites) — never stored — so the weighting can be tuned and
-- the indices recomputed for any disaggregation. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.outcome_records (
  id               text primary key,
  term             text not null,
  district         text not null,
  school_category  text not null,
  area             text not null,
  gender           text not null,
  social_category  text not null,
  pwd              boolean not null default false,
  fln_pct          numeric not null default 0,
  attendance_pct   numeric not null default 0,
  transition_pct   numeric not null default 0,
  pass_pct         numeric not null default 0,
  cohort_size      integer not null default 0,
  tenant_id        text
);

create index if not exists outcome_records_district_idx on public.outcome_records (district);
create index if not exists outcome_records_term_idx on public.outcome_records (term);
create index if not exists outcome_records_social_idx on public.outcome_records (social_category);

alter table public.outcome_records enable row level security;

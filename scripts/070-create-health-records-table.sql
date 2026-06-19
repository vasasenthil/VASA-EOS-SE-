-- VASA-EOS(SE) — durable table for the school health register (full-CRUD module).
--
-- Each row is one student's routine health screening: anthropometry (height, weight), vision/hearing/
-- dental results, immunisation status and an optional haemoglobin reading, keyed by the school's
-- tenant node. BMI, the nutrition band, the anaemia flag and the referral recommendation are DERIVED
-- on read — never stored — so they are always reproducible. Complements the RBSK clinical referral
-- flow. Written through the service-role client when configured; in-memory otherwise. RLS
-- deny-by-default.

create table if not exists public.health_records (
  id                       text primary key,
  student                  text not null,
  apaar_id                 text not null default '',
  class_level              text not null,
  section                  text not null default 'A',
  gender                   text not null,
  screening_date           date not null,
  height_cm                numeric not null default 0,
  weight_kg                numeric not null default 0,
  vision                   text not null default 'Normal',
  hearing                  text not null default 'Normal',
  dental                   text not null default 'Normal',
  immunisation_up_to_date  boolean not null default true,
  hemoglobin               numeric not null default 0,
  remarks                  text not null default '',
  tenant_id                text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists health_records_class_section_idx on public.health_records (class_level, section);
create index if not exists health_records_apaar_idx on public.health_records (apaar_id);

alter table public.health_records enable row level security;

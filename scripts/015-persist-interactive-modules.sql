-- VASA-EOS(SE) — persistence for the interactive operational modules.
-- Moves grievance redressal, the DAO-style SMC, school recognition (TN 1973),
-- verifiable credentials and the tamper-evident audit ledger from in-memory
-- demo stores to durable tables. The application falls back to in-memory stores
-- when the service-role client is not configured, so these tables are optional
-- for local/demo use and required for real cross-request persistence.

-- ---------------------------------------------------------------------------
-- Tamper-evident audit ledger (hash-chained).
-- ---------------------------------------------------------------------------
create table if not exists public.audit_trail (
  seq        bigint primary key,
  ts         timestamptz not null,
  actor      text not null,
  action     text not null,
  resource   text not null,
  details    jsonb,
  prev_hash  text not null,
  hash       text not null
);

-- ---------------------------------------------------------------------------
-- Grievance redressal.
-- ---------------------------------------------------------------------------
create table if not exists public.grievances (
  id          text primary key,
  category    text not null,
  description text not null,
  tier        int  not null default 0,
  status      text not null default 'open',
  sla_hours   int  not null default 72,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DAO-style School Management Committee proposals + votes.
-- ---------------------------------------------------------------------------
create table if not exists public.smc_proposals (
  id            text primary key,
  title         text not null,
  description   text not null,
  votes_for     int  not null default 0,
  votes_against int  not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- School recognition workflow (TN Recognised Private Schools Act 1973).
-- ---------------------------------------------------------------------------
create table if not exists public.recognition_applications (
  id            text primary key,
  school        text not null,
  district      text not null,
  type          text not null,
  stage_index   int  not null default 0,
  status        text not null default 'in_progress',
  criteria_met  jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Verifiable credentials (NFT / soulbound token).
-- ---------------------------------------------------------------------------
create table if not exists public.verifiable_credentials (
  id           text primary key,
  apaar_id     text not null,
  kind         text not null,
  title        text not null,
  issuer       text not null,
  issued_at    timestamptz not null,
  soulbound    boolean not null default true,
  content_hash text not null,
  anchor_seq   bigint not null
);

-- ---------------------------------------------------------------------------
-- DPDP consent ledger.
-- ---------------------------------------------------------------------------
create table if not exists public.consent_records (
  id            text primary key,
  subject_apaar text not null,
  purpose       text not null,
  actor         text not null,
  status        text not null,
  ts            timestamptz not null default now()
);

-- These tables are written via the privileged service-role client only; enable
-- RLS and add no public policies so they are inaccessible to anon/auth clients.
alter table public.audit_trail              enable row level security;
alter table public.grievances               enable row level security;
alter table public.smc_proposals            enable row level security;
alter table public.recognition_applications enable row level security;
alter table public.verifiable_credentials   enable row level security;
alter table public.consent_records          enable row level security;

create index if not exists idx_grievances_created      on public.grievances (created_at desc);
create index if not exists idx_smc_proposals_created   on public.smc_proposals (created_at desc);
create index if not exists idx_recognition_updated     on public.recognition_applications (updated_at desc);
create index if not exists idx_consent_subject         on public.consent_records (subject_apaar);

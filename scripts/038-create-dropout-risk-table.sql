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

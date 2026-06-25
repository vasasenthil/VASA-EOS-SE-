-- VASA-EOS(SE) — durable table for consolidated student report cards (full-CRUD module).
--
-- Each row is one student's term report card: per-subject marks stored as JSONB, plus attendance,
-- remarks and a Draft/Published status, keyed by the school's tenant node. Total, percentage,
-- overall grade and Pass/Fail are derived on read (not stored). Written through the service-role
-- client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.report_cards (
  id              text primary key,
  student         text not null,
  apaar_id        text not null default '',
  class_level     text not null,
  term            text not null,
  subjects        jsonb not null default '[]'::jsonb,
  attendance_pct  numeric not null default 0,
  remarks         text not null default '',
  status          text not null default 'Draft',
  tenant_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists report_cards_class_term_idx on public.report_cards (class_level, term);
create index if not exists report_cards_status_idx on public.report_cards (status);

alter table public.report_cards enable row level security;

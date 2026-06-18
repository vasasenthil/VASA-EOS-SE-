-- VASA-EOS(SE) — durable table for per-student fees & DBT-linked collections (full-CRUD module).
--
-- Each row is one student's fee record for an academic year: the fee heads (JSONB demand), a
-- concession/waiver and its amount, a DBT/scholarship linkage, the receipts ledger (JSONB
-- collection), a due date and notes, keyed by the school's tenant node. Net demand, balance,
-- payment status and the defaulter flag are derived on read (not stored). Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.student_fees (
  id                 text primary key,
  student            text not null,
  apaar_id           text not null default '',
  class_level        text not null,
  section            text not null default 'A',
  academic_year      text not null,
  heads              jsonb not null default '[]'::jsonb,
  concession_type    text not null default 'None',
  concession_amount  numeric not null default 0,
  scholarship_scheme text not null default '',
  dbt_reference      text not null default '',
  due_date           date not null,
  receipts           jsonb not null default '[]'::jsonb,
  notes              text not null default '',
  tenant_id          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists student_fees_class_section_idx on public.student_fees (class_level, section);
create index if not exists student_fees_year_idx on public.student_fees (academic_year);
create index if not exists student_fees_apaar_idx on public.student_fees (apaar_id);

alter table public.student_fees enable row level security;

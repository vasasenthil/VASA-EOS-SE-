-- VASA-EOS(SE) — durable table for the staff master / HR directory (full-CRUD module).
--
-- Each row is one staff member: identity (staff id, name), role (designation, cadre, department),
-- demographics (gender, dob), joining/qualification, contact (phone, email), employment type and
-- service status, plus casual/earned leave balances and pay scale, keyed by the school's tenant
-- node. Service years, age and the retirement-due flag are derived on read. Written through the
-- service-role client when configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.staff_master (
  id                    text primary key,
  staff_id              text not null,
  name                  text not null,
  designation           text not null,
  cadre                 text not null default 'Teaching',
  department            text not null default 'Administration',
  gender                text not null,
  dob                   date not null,
  doj                   date not null,
  qualification         text not null default '',
  phone                 text not null default '',
  email                 text not null default '',
  employment_type       text not null default 'Permanent',
  status                text not null default 'Active',
  casual_leave_balance  numeric not null default 0,
  earned_leave_balance  numeric not null default 0,
  pay_scale             text not null default '',
  notes                 text not null default '',
  tenant_id             text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists staff_master_staffid_idx on public.staff_master (staff_id);
create index if not exists staff_master_cadre_idx on public.staff_master (cadre);
create index if not exists staff_master_status_idx on public.staff_master (status);

alter table public.staff_master enable row level security;

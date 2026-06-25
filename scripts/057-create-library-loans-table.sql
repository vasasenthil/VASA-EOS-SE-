-- VASA-EOS(SE) — durable table for library circulation loans (full-CRUD module).
--
-- Each row is one book copy issued to a member: the book (accession no, title, author, category),
-- the member (name, id, type, class), the issue/due/return dates, renewals and the fine policy
-- (fine/day + waived), keyed by the school's tenant node. Loan status (Issued/Returned/Overdue) and
-- the fine due are derived on read. Written through the service-role client when configured;
-- in-memory otherwise. RLS deny-by-default.

create table if not exists public.library_loans (
  id             text primary key,
  accession_no   text not null,
  title          text not null,
  author         text not null,
  category       text not null default 'Textbook',
  member         text not null,
  member_id      text not null,
  member_type    text not null default 'Student',
  class_level    text not null default '',
  issue_date     date not null,
  due_date       date not null,
  return_date    date,
  renewal_count  integer not null default 0,
  fine_per_day   numeric not null default 2,
  fine_waived    numeric not null default 0,
  notes          text not null default '',
  tenant_id      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists library_loans_accession_idx on public.library_loans (accession_no);
create index if not exists library_loans_member_idx on public.library_loans (member_id);
create index if not exists library_loans_due_idx on public.library_loans (due_date);

alter table public.library_loans enable row level security;

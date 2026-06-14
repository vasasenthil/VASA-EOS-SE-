-- VASA-EOS(SE) — durable table for the child-safety incident vertical.
--
-- Each incident carries a live SAFETY_INCIDENT workflow instance (School verification +
-- mandatory report -> Block safety review -> District Child Protection Unit for mandatory/high
-- cases) plus the rich detail (severity, date, factual account, reporter, mandatory-report
-- flag). POCSO §23: only an anonymised case_ref is stored — NEVER a victim identity. These are
-- highly sensitive safeguarding rows: RLS is enabled deny-by-default; only the trusted
-- service-role (which performs the app's own scoping) can read them.

create table if not exists public.safety_flows (
  id          text primary key,
  case_ref    text not null,
  category    text not null,
  escalate    boolean not null default false,
  instance    jsonb not null default '{}'::jsonb,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists safety_flows_created_idx on public.safety_flows (created_at desc);

alter table public.safety_flows enable row level security;

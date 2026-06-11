-- VASA-EOS(SE) — durable table for the state-tier governance forum vertical.
--
-- Each governance-forum item (a resolution tabled at a State executive forum)
-- persists one row carrying a live FORUM_RESOLUTION workflow instance
-- (Secretary convenes & adopts -> quorum of 2 Directors adopts -> Minister
-- ratifies significant items) plus the rich intake captured by the convene form
-- (RACI ownership, category, meeting date, decision text, fund implication).
-- Written through the service-role client when configured; in-memory otherwise.
--
-- Security posture matches the other workflow flow tables (scripts/021): RLS
-- enabled with NO permissive policy, so anon/authenticated read nothing directly;
-- the trusted service-role bypasses RLS and performs the app's own ReBAC scoping.
-- Not tenant-scoped (state-tier governance is above the TN tenant subtree today).

create table if not exists public.forum_flows (
  id               text primary key,
  forum            text not null,
  title            text not null,
  requires_minister boolean not null default false,
  action_items     jsonb not null default '[]'::jsonb,
  instance         jsonb not null default '{}'::jsonb,
  details          jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists forum_flows_created_idx on public.forum_flows (created_at desc);

alter table public.forum_flows enable row level security;

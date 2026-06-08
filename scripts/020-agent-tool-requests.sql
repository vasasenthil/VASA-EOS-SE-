-- VASA-EOS(SE) — agent tool-approval queue (human-in-the-loop).
-- Side-effecting agent tool calls are queued here as pending requests until a human
-- approves (the tool then runs against its real seam) or rejects. The app falls back
-- to an in-memory store when the service-role client is not configured.

create table if not exists public.agent_tool_requests (
  id           text primary key,
  agent        text not null,
  tool         text not null,
  args         jsonb not null default '{}'::jsonb,
  status       text not null default 'pending',  -- pending | approved | rejected
  requested_at timestamptz not null default now(),
  output       text
);

create index if not exists agent_tool_requests_status_idx
  on public.agent_tool_requests (status, requested_at desc);

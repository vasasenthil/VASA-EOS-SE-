-- VASA-EOS(SE) — durable table for the AI agent task inbox (full-CRUD module).
--
-- Each row is one task dispatched to a Native-AI agent: the agent + scope, the input, the agent's
-- advisory output (output, confidence, reasoning, available_tools JSONB, assertive, mode), the
-- high-stakes/approval flag, and the HUMAN review (status, reviewed_by, notes), keyed by the
-- school's tenant node. The agents operate under continuous human authority — high-stakes agents
-- route their action through human approval. Written through the service-role client when
-- configured; in-memory otherwise. RLS deny-by-default.

create table if not exists public.agent_tasks (
  id                 text primary key,
  agent              text not null,
  agent_label        text not null,
  scope              text not null default '',
  input              text not null,
  output             text not null default '',
  confidence         numeric not null default 0,
  reasoning          text not null default '',
  available_tools    jsonb not null default '[]'::jsonb,
  requires_approval  boolean not null default false,
  assertive          boolean not null default false,
  mode               text not null default 'mock',
  status             text not null default 'Pending',
  reviewed_by        text not null default '',
  notes              text not null default '',
  tenant_id          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists agent_tasks_agent_idx on public.agent_tasks (agent);
create index if not exists agent_tasks_status_idx on public.agent_tasks (status);

alter table public.agent_tasks enable row level security;

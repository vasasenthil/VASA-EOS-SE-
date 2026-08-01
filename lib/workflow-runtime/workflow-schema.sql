-- VASA-EOS(SE) — durable workflow runtime instances for Postgres/Supabase.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workflow_instance_status') then
    create type workflow_instance_status as enum ('running', 'completed', 'rejected', 'compensating', 'failed');
  end if;
end $$;

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  workflow_type text not null,
  aggregate_id text not null,
  current_step_index integer not null default 0 check (current_step_index >= 0),
  status workflow_instance_status not null default 'running',
  payload jsonb not null default '{}'::jsonb,
  current_step_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_instances_payload_object check (jsonb_typeof(payload) = 'object')
);

create unique index if not exists workflow_instances_type_aggregate_idx
  on public.workflow_instances (workflow_type, aggregate_id);

create index if not exists workflow_instances_sla_monitor_idx
  on public.workflow_instances (status, current_step_started_at)
  where status = 'running';

create or replace function public.workflow_instances_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workflow_instances_touch_updated_at on public.workflow_instances;
create trigger workflow_instances_touch_updated_at
before update on public.workflow_instances
for each row execute function public.workflow_instances_touch_updated_at();

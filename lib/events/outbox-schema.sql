-- VASA-EOS(SE) — durable platform outbox for Postgres/Supabase.
-- The table is the local event log used by the transactional outbox pattern.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'platform_outbox_status') then
    create type platform_outbox_status as enum ('pending', 'processed', 'failed');
  end if;
end $$;

create table if not exists public.platform_outbox (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  payload jsonb not null,
  status platform_outbox_status not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  retry_count integer not null default 0 check (retry_count >= 0),
  idempotency_key text not null,
  last_error text,
  locked_at timestamptz,
  locked_by text,
  constraint platform_outbox_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint platform_outbox_processed_at_required check (status <> 'processed' or processed_at is not null)
);

create unique index if not exists platform_outbox_idempotency_key_idx
  on public.platform_outbox (idempotency_key);

create index if not exists platform_outbox_pending_poll_idx
  on public.platform_outbox (status, created_at, id)
  where status = 'pending';

create index if not exists platform_outbox_failed_retry_idx
  on public.platform_outbox (status, retry_count, created_at)
  where status = 'failed';

create index if not exists platform_outbox_aggregate_idx
  on public.platform_outbox (aggregate_type, aggregate_id, created_at);

create or replace function public.platform_commit_outbox_events(events jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  event jsonb;
begin
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (
      id,
      aggregate_type,
      aggregate_id,
      event_type,
      payload,
      idempotency_key
    ) values (
      coalesce((event->>'id')::uuid, gen_random_uuid()),
      event->>'aggregateType',
      event->>'aggregateId',
      event->>'eventType',
      event->'payload',
      event->>'idempotencyKey'
    ) on conflict (idempotency_key) do nothing;
  end loop;
end;
$$;

create or replace function public.platform_claim_outbox_batch(worker_id text, batch_size integer default 50)
returns setof public.platform_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    select id
    from public.platform_outbox
    where status = 'pending'
      and (locked_at is null or locked_at < now() - interval '5 minutes')
    order by created_at, id
    limit greatest(batch_size, 1)
    for update skip locked
  )
  update public.platform_outbox o
  set locked_at = now(), locked_by = worker_id
  from claimed
  where o.id = claimed.id
  returning o.*;
end;
$$;

create or replace function public.platform_mark_outbox_processed(event_id uuid, worker_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_outbox
  set status = 'processed', processed_at = now(), locked_at = null, locked_by = null, last_error = null
  where id = event_id and status = 'pending' and locked_by = worker_id;
end;
$$;

create or replace function public.platform_mark_outbox_failed(event_id uuid, worker_id text, error_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.platform_outbox
  set status = 'failed', retry_count = retry_count + 1, locked_at = null, locked_by = null, last_error = left(error_message, 2000)
  where id = event_id and status = 'pending' and locked_by = worker_id;
end;
$$;

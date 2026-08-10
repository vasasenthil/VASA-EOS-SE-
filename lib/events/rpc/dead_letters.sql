do $$
begin
  if not exists (select 1 from pg_type where typname = 'platform_dead_letter_status') then
    create type platform_dead_letter_status as enum ('open', 'retried', 'discarded');
  end if;
end $$;

create table if not exists public.platform_outbox_dead_letters (
  id uuid primary key default gen_random_uuid(),
  outbox_event_id uuid,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  payload jsonb not null,
  retry_count integer not null default 0,
  last_error text not null,
  status platform_dead_letter_status not null default 'open',
  failed_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists platform_dead_letters_open_idx
  on public.platform_outbox_dead_letters (status, failed_at desc)
  where status = 'open';

create or replace function public.platform_retry_dead_letter(dead_letter_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  dl public.platform_outbox_dead_letters%rowtype;
  new_outbox_id uuid := gen_random_uuid();
begin
  select * into dl from public.platform_outbox_dead_letters where id = dead_letter_id and status = 'open' for update;
  if not found then
    raise exception 'open dead letter % not found', dead_letter_id;
  end if;

  insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, retry_count, idempotency_key)
  values (new_outbox_id, dl.aggregate_type, dl.aggregate_id, dl.event_type, dl.payload, 'pending', 0, 'retry:' || dead_letter_id::text || ':' || new_outbox_id::text);

  update public.platform_outbox_dead_letters
  set status = 'retried', resolved_at = now()
  where id = dead_letter_id;
  return new_outbox_id;
end;
$$;

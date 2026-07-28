-- Atomic generic insert + transactional outbox RPC.
-- PostgreSQL executes a function call inside one transaction; any exception rolls back both writes.
create or replace function public.insert_with_outbox(
  target_table text,
  row_data jsonb,
  events jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
  event jsonb;
  allowed_table text;
begin
  if jsonb_typeof(row_data) <> 'object' then
    raise exception 'row_data must be a JSON object';
  end if;
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;

  select table_name into allowed_table
  from information_schema.tables
  where table_schema = 'public' and table_name = target_table;
  if allowed_table is null then
    raise exception 'target table %.% is not allowed', 'public', target_table;
  end if;

  execute format(
    'insert into public.%I select * from jsonb_populate_record(null::public.%I, $1) returning id',
    target_table,
    target_table
  ) using row_data into inserted_id;

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, idempotency_key)
    values (
      coalesce((event->>'id')::uuid, gen_random_uuid()),
      event->>'aggregateType',
      event->>'aggregateId',
      event->>'eventType',
      event->'payload',
      'pending',
      coalesce(event->>'idempotencyKey', event->>'id')
    ) on conflict (idempotency_key) do nothing;
  end loop;

  return inserted_id;
end;
$$;

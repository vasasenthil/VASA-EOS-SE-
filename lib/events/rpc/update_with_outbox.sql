-- Atomic generic update + transactional outbox RPC.
create or replace function public.update_with_outbox(
  target_table text,
  target_id uuid,
  patch_data jsonb,
  events jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event jsonb;
  affected_id uuid;
  key text;
  assignment_sql text := '';
  value_index integer := 1;
begin
  if jsonb_typeof(patch_data) <> 'object' then
    raise exception 'patch_data must be a JSON object';
  end if;
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = target_table) then
    raise exception 'target table %.% is not allowed', 'public', target_table;
  end if;

  for key in select * from jsonb_object_keys(patch_data)
  loop
    if key = 'id' then
      continue;
    end if;
    assignment_sql := assignment_sql || case when assignment_sql = '' then '' else ', ' end || format('%I = ($1 ->> %L)::text', key, key);
    value_index := value_index + 1;
  end loop;

  if assignment_sql = '' then
    raise exception 'patch_data must include at least one mutable field';
  end if;

  execute format('update public.%I set %s where id = $2 returning id', target_table, assignment_sql)
  using patch_data, target_id into affected_id;
  if affected_id is null then
    raise exception 'row % not found in %', target_id, target_table;
  end if;

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, idempotency_key)
    values (coalesce((event->>'id')::uuid, gen_random_uuid()), event->>'aggregateType', event->>'aggregateId', event->>'eventType', event->'payload', 'pending', coalesce(event->>'idempotencyKey', event->>'id'))
    on conflict (idempotency_key) do nothing;
  end loop;
  return affected_id;
end;
$$;

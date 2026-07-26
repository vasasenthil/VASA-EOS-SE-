-- Generic atomic domain-row + outbox commit RPC.
-- PostgreSQL executes a function call inside one physical transaction; any exception
-- rolls back both the domain insert and every platform_outbox insert.
create or replace function public.platform_generic_atomic_commit(
  p_table_name text,
  p_row_data jsonb,
  p_events jsonb,
  p_tenant_context jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_row jsonb;
  v_event jsonb;
  v_table_name text;
  v_row_data jsonb := p_row_data;
  v_tenant_id text := coalesce(p_tenant_context->>'tenant_id', p_tenant_context->>'tenantId');
begin
  if p_table_name is null or length(trim(p_table_name)) = 0 then
    raise exception 'p_table_name is required';
  end if;
  if p_row_data is null or jsonb_typeof(p_row_data) <> 'object' then
    raise exception 'p_row_data must be a JSON object';
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events must be a JSON array';
  end if;

  select table_name into v_table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE'
    and table_name = p_table_name;

  if v_table_name is null then
    raise exception 'target table public.% is not allowed', p_table_name;
  end if;

  if v_tenant_id is not null
     and not (v_row_data ? 'tenant_id')
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = v_table_name
         and column_name = 'tenant_id'
     ) then
    v_row_data := v_row_data || jsonb_build_object('tenant_id', v_tenant_id);
  end if;

  execute format(
    'with inserted as (insert into public.%I select * from jsonb_populate_record(null::public.%I, $1) returning *) select to_jsonb(inserted) from inserted',
    v_table_name,
    v_table_name
  ) using v_row_data into v_inserted_row;

  if v_inserted_row is null then
    raise exception 'insert into public.% returned no row', v_table_name;
  end if;

  for v_event in select * from jsonb_array_elements(p_events)
  loop
    if coalesce(v_event->>'aggregateType', v_event->>'aggregate_type') is null
       or coalesce(v_event->>'aggregateId', v_event->>'aggregate_id') is null
       or coalesce(v_event->>'eventType', v_event->>'event_type') is null then
      raise exception 'outbox event is missing aggregate/event identity: %', v_event;
    end if;

    insert into public.platform_outbox (
      id,
      aggregate_type,
      aggregate_id,
      event_type,
      payload,
      status,
      idempotency_key,
      correlation_id,
      causation_id,
      actor
    ) values (
      coalesce((v_event->>'id')::uuid, gen_random_uuid()),
      coalesce(v_event->>'aggregateType', v_event->>'aggregate_type'),
      coalesce(v_event->>'aggregateId', v_event->>'aggregate_id'),
      coalesce(v_event->>'eventType', v_event->>'event_type'),
      coalesce(v_event->'payload', '{}'::jsonb),
      'pending',
      coalesce(v_event->>'idempotencyKey', v_event->>'idempotency_key', v_event->>'id', gen_random_uuid()::text),
      nullif(coalesce(v_event->>'correlationId', v_event->>'correlation_id'), '')::uuid,
      nullif(coalesce(v_event->>'causationId', v_event->>'causation_id'), '')::uuid,
      nullif(v_event->>'actor', '')
    ) on conflict (idempotency_key) do nothing;
  end loop;

  return v_inserted_row;
end;
$$;

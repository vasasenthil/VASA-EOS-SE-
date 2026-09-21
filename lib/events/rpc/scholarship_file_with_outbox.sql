create or replace function public.scholarship_file_with_outbox(application jsonb, events jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  scholarship_id text := application->>'id';
  workflow_id uuid := (application->>'workflowId')::uuid;
  event jsonb;
begin
  if scholarship_id is null or scholarship_id = '' then
    raise exception 'application.id is required';
  end if;
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;

  insert into public.scholarship_flows (id, student, scheme, amount, instance, details, tenant_id, created_at)
  values (
    scholarship_id,
    application->>'student',
    application->>'scheme',
    coalesce((application->>'amount')::numeric, 0),
    application->'instance',
    application->'details',
    coalesce(application->>'tenantId', 'TN-STATE/DIST-CHN/BLK-DEMO/SCH-001'),
    now()
  );

  insert into public.workflow_instances (id, workflow_type, aggregate_id, current_step_index, status, payload, current_step_started_at, created_at, updated_at)
  values (workflow_id, 'scholarship-sanction', scholarship_id, 0, 'running', jsonb_build_object('context', application->'context'), now(), now(), now())
  on conflict (id) do nothing;

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, idempotency_key)
    values (coalesce((event->>'id')::uuid, gen_random_uuid()), event->>'aggregateType', event->>'aggregateId', event->>'eventType', event->'payload', 'pending', coalesce(event->>'idempotencyKey', event->>'id'))
    on conflict (idempotency_key) do nothing;
  end loop;
  return scholarship_id;
end;
$$;

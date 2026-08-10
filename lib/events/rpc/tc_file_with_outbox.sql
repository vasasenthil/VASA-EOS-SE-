create or replace function public.tc_file_with_outbox(application jsonb, events jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  tc_id text := application->>'id';
  workflow_id uuid := (application->>'workflowId')::uuid;
  event jsonb;
begin
  if tc_id is null or tc_id = '' then
    raise exception 'application.id is required';
  end if;
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;

  insert into public.tc_flows (id, student, instance, details, created_at)
  values (tc_id, application->>'student', application->'instance', application->'details', now());

  insert into public.workflow_instances (id, workflow_type, aggregate_id, current_step_index, status, payload, current_step_started_at, created_at, updated_at)
  values (workflow_id, 'tc-issuance', tc_id, 0, 'running', jsonb_build_object('context', application->'context'), now(), now(), now())
  on conflict (id) do nothing;

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, idempotency_key)
    values (coalesce((event->>'id')::uuid, gen_random_uuid()), event->>'aggregateType', event->>'aggregateId', event->>'eventType', event->'payload', 'pending', coalesce(event->>'idempotencyKey', event->>'id'))
    on conflict (idempotency_key) do nothing;
  end loop;
  return tc_id;
end;
$$;

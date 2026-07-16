create or replace function public.tc_file_with_outbox(application jsonb, events jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tc_id uuid := coalesce((application->>'id')::uuid, gen_random_uuid());
  event jsonb;
begin
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;

  insert into public.transfer_certificate_applications (id, student_id, from_school_id, to_school_id, reason, status, payload, created_at)
  values (tc_id, application->>'studentId', application->>'fromSchoolId', application->>'toSchoolId', application->>'reason', coalesce(application->>'status', 'filed'), application, now());

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, idempotency_key)
    values (coalesce((event->>'id')::uuid, gen_random_uuid()), event->>'aggregateType', event->>'aggregateId', event->>'eventType', event->'payload', 'pending', coalesce(event->>'idempotencyKey', event->>'id'))
    on conflict (idempotency_key) do nothing;
  end loop;
  return tc_id;
end;
$$;

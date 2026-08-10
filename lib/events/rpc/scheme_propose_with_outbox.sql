create or replace function public.scheme_propose_with_outbox(scheme_id uuid, proposed_by text, proposal jsonb, events jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event jsonb;
begin
  update public.schemes
  set status = 'proposed', updated_at = now()
  where id = scheme_id;
  if not found then
    raise exception 'scheme % not found', scheme_id;
  end if;

  insert into public.scheme_proposals (scheme_id, proposed_by, proposal, status, created_at)
  values (scheme_id, proposed_by, proposal, 'proposed', now());

  for event in select * from jsonb_array_elements(events)
  loop
    insert into public.platform_outbox (id, aggregate_type, aggregate_id, event_type, payload, status, idempotency_key)
    values (coalesce((event->>'id')::uuid, gen_random_uuid()), event->>'aggregateType', event->>'aggregateId', event->>'eventType', event->'payload', 'pending', coalesce(event->>'idempotencyKey', event->>'id'))
    on conflict (idempotency_key) do nothing;
  end loop;
  return scheme_id;
end;
$$;

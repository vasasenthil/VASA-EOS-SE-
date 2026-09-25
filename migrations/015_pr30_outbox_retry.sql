-- Five total failed attempts. A failed terminal delivery is never reclaimed.
alter table public.platform_outbox add column if not exists next_attempt_at timestamptz not null default now();
create index if not exists platform_outbox_due_idx on public.platform_outbox(next_attempt_at, created_at) where status = 'pending';
-- Refuse the upgrade if existing duplicate source-event DLQs need reconciliation;
-- never delete operator evidence automatically.
create unique index if not exists platform_dlq_source_unique on public.platform_outbox_dead_letters(outbox_event_id) where outbox_event_id is not null;

-- Repair previously stranded retryable events without resetting attempt counts.
update public.platform_outbox set status = 'pending', next_attempt_at = now(), locked_at = null, locked_by = null
where status = 'failed' and retry_count < 5;
insert into public.platform_outbox_dead_letters(outbox_event_id, aggregate_type, aggregate_id, event_type, payload, retry_count, last_error)
select id, aggregate_type, aggregate_id, event_type, payload, retry_count, coalesce(last_error, 'retry limit reached')
from public.platform_outbox where status = 'failed' and retry_count >= 5
on conflict (outbox_event_id) where outbox_event_id is not null do nothing;

create or replace function public.platform_claim_outbox_batch(worker_id text, batch_size integer default 50)
returns setof public.platform_outbox
language plpgsql security definer set search_path = pg_catalog, public
as $claim$
begin
  if worker_id is null or btrim(worker_id) = '' then raise exception 'worker_id is required'; end if;
  return query
  with claimed as (
    select id from public.platform_outbox
    where status = 'pending' and retry_count < 5 and next_attempt_at <= now()
      and (locked_at is null or locked_at < now() - interval '5 minutes')
    order by next_attempt_at, created_at, id
    limit least(greatest(batch_size, 1), 500)
    for update skip locked
  )
  update public.platform_outbox o set locked_at = now(), locked_by = worker_id
  from claimed where o.id = claimed.id returning o.*;
end;
$claim$;

create or replace function public.platform_mark_outbox_failed(event_id uuid, worker_id text, error_message text)
returns void
language plpgsql security definer set search_path = pg_catalog, public
as $failure$
declare failed_row public.platform_outbox%rowtype;
begin
  update public.platform_outbox
  set retry_count = retry_count + 1,
      status = case when retry_count + 1 >= 5 then 'failed'::public.platform_outbox_status else 'pending'::public.platform_outbox_status end,
      next_attempt_at = now() + make_interval(secs => least(300.0, power(2.0, least(retry_count + 1, 8)))) + random() * interval '1 second',
      locked_at = null, locked_by = null, last_error = left(error_message, 2000)
  where id = event_id and status = 'pending' and locked_by = worker_id
  returning * into failed_row;
  if not found then raise exception 'outbox lease lost'; end if;
  if failed_row.status = 'failed' then
    insert into public.platform_outbox_dead_letters(outbox_event_id, aggregate_type, aggregate_id, event_type, payload, retry_count, last_error)
    values (failed_row.id, failed_row.aggregate_type, failed_row.aggregate_id, failed_row.event_type, failed_row.payload, failed_row.retry_count, coalesce(failed_row.last_error, 'retry limit reached'))
    on conflict (outbox_event_id) where outbox_event_id is not null do nothing;
  end if;
end;
$failure$;

create or replace function public.platform_mark_outbox_processed(event_id uuid, worker_id text)
returns void
language plpgsql security definer set search_path = pg_catalog, public
as $processed$
begin
  update public.platform_outbox
  set status = 'processed', processed_at = now(), locked_at = null, locked_by = null, last_error = null
  where id = event_id and status = 'pending' and locked_by = worker_id;
  if not found then raise exception 'outbox lease lost'; end if;
end;
$processed$;

revoke all privileges on function public.platform_claim_outbox_batch(text,integer), public.platform_mark_outbox_failed(uuid,text,text), public.platform_mark_outbox_processed(uuid,text) from public, anon, authenticated;
grant execute on function public.platform_claim_outbox_batch(text,integer), public.platform_mark_outbox_failed(uuid,text,text), public.platform_mark_outbox_processed(uuid,text) to service_role;

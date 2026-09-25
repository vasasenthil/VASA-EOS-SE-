-- Forward-only PR30 security migration after 013_policy_baseline.
-- Applied by the repaired transactional deployment runner.
-- Run transactionally with the migration ledger insert.

-- ML storage is server-only for this release. No browser-role policies are
-- introduced: authorization and tenant filtering remain mandatory in the API.
do $ml_access$
declare t text;
begin
  foreach t in array array[
    'ml_models', 'ml_predictions', 'ml_outcomes', 'ml_drift_reports',
    'ml_training_runs', 'ml_feature_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$ml_access$;

-- Containment: disable the three arbitrary-table RPCs, INCLUDING service_role,
-- pending typed replacements or reviewed table/column allowlists. Owner still
-- has authority; never use the migration-owner credentials in the application.
revoke all privileges on function public.platform_generic_atomic_commit(text,jsonb,jsonb,jsonb) from public, anon, authenticated, service_role;
revoke all privileges on function public.insert_with_outbox(text,jsonb,jsonb) from public, anon, authenticated, service_role;
revoke all privileges on function public.update_with_outbox(text,uuid,jsonb,jsonb) from public, anon, authenticated, service_role;

-- Existing outbox control RPCs must be internal, even if their callers are
-- guarded HTTP routes. Review operation-specific wrappers separately.
revoke all privileges on function public.platform_commit_outbox_events(jsonb) from public, anon, authenticated;
revoke all privileges on function public.platform_claim_outbox_batch(text,integer) from public, anon, authenticated;
revoke all privileges on function public.platform_mark_outbox_processed(uuid,text) from public, anon, authenticated;
revoke all privileges on function public.platform_mark_outbox_failed(uuid,text,text) from public, anon, authenticated;
revoke all privileges on function public.platform_retry_dead_letter(uuid) from public, anon, authenticated;
grant execute on function public.platform_commit_outbox_events(jsonb) to service_role;
grant execute on function public.platform_claim_outbox_batch(text,integer) to service_role;
grant execute on function public.platform_mark_outbox_processed(uuid,text) to service_role;
grant execute on function public.platform_mark_outbox_failed(uuid,text,text) to service_role;
grant execute on function public.platform_retry_dead_letter(uuid) to service_role;

-- Close owner-privileged domain wrappers as well as the generic functions.
revoke all privileges on function public.scholarship_file_with_outbox(jsonb,jsonb) from public, anon, authenticated;
revoke all privileges on function public.tc_file_with_outbox(jsonb,jsonb) from public, anon, authenticated;
revoke all privileges on function public.scheme_propose_with_outbox(uuid,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.scholarship_file_with_outbox(jsonb,jsonb) to service_role;
grant execute on function public.tc_file_with_outbox(jsonb,jsonb) to service_role;
grant execute on function public.scheme_propose_with_outbox(uuid,text,jsonb,jsonb) to service_role;

alter table public.platform_outbox enable row level security;
alter table public.platform_outbox_dead_letters enable row level security;
alter table public.worker_heartbeats enable row level security;
revoke all privileges on table public.platform_outbox, public.platform_outbox_dead_letters, public.worker_heartbeats from public, anon, authenticated;
grant select, insert, update, delete on table public.platform_outbox, public.platform_outbox_dead_letters, public.worker_heartbeats to service_role;

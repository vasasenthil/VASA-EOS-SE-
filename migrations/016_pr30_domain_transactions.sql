-- One transaction for allowlisted domain commands, command receipt and outbox.
-- No caller-supplied SQL, relation outside the allowlist, or unrestricted column name.
create table public.platform_command_receipts (
 command_id text primary key, request jsonb not null, result jsonb, created_at timestamptz not null default now()
);
alter table public.platform_command_receipts enable row level security;
revoke all on public.platform_command_receipts from public, anon, authenticated;

create or replace function public.platform_apply_domain_commands(command_id text, commands jsonb, events jsonb, command_result jsonb default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
 cmd jsonb; row_data jsonb; old_row jsonb; normalized_expected jsonb; request_body jsonb; receipt public.platform_command_receipts;
 tbl text; operation text; allowed text[]; key_columns text[]; modes text[];
 columns_sql text; select_sql text; set_sql text; predicate_sql text; conflict_sql text; affected bigint;
begin
 if commands is null or events is null or command_id is null or length(command_id) not between 1 and 200 or jsonb_typeof(commands) <> 'array'
   or jsonb_typeof(events) <> 'array' or jsonb_array_length(commands) > 500 then raise exception 'Invalid command batch'; end if;
 -- Serialize supported command batches (including no-event mutations). Conservative correctness
 -- first: individual domain locks can replace this only with measured contention evidence.
 perform pg_advisory_xact_lock(78300016);
 request_body := jsonb_build_object('commands',commands,'events',events,'result',command_result);
 select * into receipt from public.platform_command_receipts r where r.command_id = platform_apply_domain_commands.command_id;
 if found then
   if receipt.request <> request_body then raise exception 'Command key reused with different content'; end if;
   return receipt.result;
 end if;
 if exists(select 1 from jsonb_array_elements(events) e group by e->>'idempotencyKey' having count(*)>1) then raise exception 'Duplicate event keys'; end if;
 -- A reused event key must not suppress events for a fresh domain mutation.
 if exists(select 1 from jsonb_array_elements(events) e join public.platform_outbox o on o.idempotency_key=e->>'idempotencyKey') then
   raise exception 'Event key already committed';
 end if;
 for cmd in select value from jsonb_array_elements(commands) loop
  tbl := cmd->>'table'; operation := cmd->>'mode'; row_data := cmd->'row';
  case tbl
    when 'schemes' then allowed := array['id','name','description','category','eligibility','budget','fiscal_year','timeline','status','proposed_by','approved_by','justification','expected_outcomes','workflow_id','jurisdiction_id','created_at','updated_at']; key_columns := array['id']; modes := array['insert','upsert','delete'];
    when 'workflow_instances' then allowed := array['id','workflow_type','aggregate_id','current_step_index','status','payload','current_step_started_at','created_at','updated_at']; key_columns := array['id']; modes := array['insert','update'];
    when 'scheme_budgets' then allowed := array['scheme_id','fiscal_year','allocated','released','utilized','updated_at']; key_columns := array['scheme_id','fiscal_year']; modes := array['insert','update'];
    when 'scheme_beneficiaries' then allowed := array['id','scheme_id','beneficiary_id','beneficiary_name','benefit_type','amount','district','added_at']; key_columns := array['scheme_id','beneficiary_id','benefit_type']; modes := array['upsert'];
    when 'scheme_outcomes' then allowed := array['id','scheme_id','beneficiaries','impact_metrics','evaluation','recorded_at']; key_columns := array['id']; modes := array['insert'];
    when 'ml_models' then allowed := array['id','model_type','version','status','metrics','artifact','dataset_hash','high_stakes','promoted_at','created_at']; key_columns := array['id']; modes := array['upsert'];
    when 'ml_predictions' then allowed := array['id','model_id','model_type','model_version','input_features','prediction','confidence','created_at']; key_columns := array['id']; modes := array['upsert'];
    when 'ml_outcomes' then allowed := array['id','prediction_id','actual_outcome','ground_truth_source','observed_at']; key_columns := array['prediction_id','ground_truth_source']; modes := array['upsert'];
    when 'ml_drift_reports' then allowed := array['id','model_id','model_type','model_version','drift_type','magnitude','threshold','severity','detected_at']; key_columns := array['id']; modes := array['insert'];
    when 'ml_training_runs' then allowed := array['id','model_type','version','metrics','dataset_hash','duration_seconds','created_at']; key_columns := array['model_type','version','dataset_hash']; modes := array['upsert'];
    when 'ml_feature_snapshots' then allowed := array['id','model_type','dataset_hash','feature_distributions','created_at']; key_columns := array['model_type','dataset_hash']; modes := array['upsert'];
    when 'audit_trail' then allowed := array['seq','ts','actor','action','resource','details','prev_hash','hash']; key_columns := array['seq']; modes := array['insert'];
    when 'tc_flows' then allowed := array['id','instance']; key_columns := array['id']; modes := array['update'];
    when 'scholarship_flows' then allowed := array['id','instance']; key_columns := array['id']; modes := array['update'];
    else raise exception 'Unsupported domain command';
  end case;
  if operation is null or not operation = any(modes) or row_data is null or jsonb_typeof(row_data) <> 'object'
     or exists(select 1 from jsonb_object_keys(row_data) k where not k = any(allowed))
     or cmd->'keys' is distinct from to_jsonb(key_columns) then raise exception 'Invalid command fields'; end if;
  if operation in ('update','delete','upsert') and exists(select 1 from unnest(key_columns) k where row_data->>k is null) then raise exception 'Missing domain key'; end if;
  select string_agg(format('%I',k),',' order by k), string_agg(format('v.%I',k),',' order by k),
         string_agg(format('%I = v.%I',k,k),',' order by k) filter(where not k=any(key_columns))
    into columns_sql,select_sql,set_sql from jsonb_object_keys(row_data) k;
  select string_agg(format('t.%I = v.%I',k,k),' and '), string_agg(format('%I',k),',')
    into predicate_sql, conflict_sql from unnest(key_columns) k;
  if cmd ? 'expected' then
    execute format('select to_jsonb(t) from public.%I t, jsonb_populate_record(null::public.%I,$1) v where %s for update of t',tbl,tbl,predicate_sql) into old_row using row_data;
    execute format('select jsonb_object_agg(k,to_jsonb(v)->k) from jsonb_populate_record(null::public.%I,$1) v, jsonb_object_keys($1) k',tbl) into normalized_expected using cmd->'expected';
    if old_row is null or not old_row @> normalized_expected then raise exception 'Domain state changed; refresh and retry' using errcode='40001'; end if;
  end if;
  if operation = 'insert' then
    execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) v',tbl,columns_sql,select_sql,tbl) using row_data;
  elsif operation = 'upsert' then
    select string_agg(format('%I = excluded.%I',k,k),',' order by k) into set_sql from jsonb_object_keys(row_data) k where not k=any(key_columns);
    execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) v on conflict (%s) do update set %s',tbl,columns_sql,select_sql,tbl,conflict_sql,set_sql) using row_data;
  elsif operation = 'update' then
    execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) v where %s',tbl,set_sql,tbl,predicate_sql) using row_data;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'Domain row missing'; end if;
  else
    execute format('delete from public.%I t using jsonb_populate_record(null::public.%I,$1) v where %s',tbl,tbl,predicate_sql) using row_data;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'Domain row missing'; end if;
  end if;
 end loop;
 perform public.platform_commit_outbox_events(events);
 insert into public.platform_command_receipts values(command_id,request_body,command_result,now());
 return command_result;
end $$;
revoke all on function public.platform_apply_domain_commands(text,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.platform_apply_domain_commands(text,jsonb,jsonb,jsonb) to service_role;

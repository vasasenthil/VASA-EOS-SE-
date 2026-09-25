-- Execute in an isolated database, never against live records.
do $$
declare commands jsonb; events jsonb; saved_time timestamptz;
begin
 commands := '[{"table":"workflow_instances","mode":"insert","keys":["id"],"row":{"id":"b0000000-0000-4000-8000-000000000001","workflow_type":"tc-issuance","aggregate_id":"test","current_step_index":0,"status":"running","payload":{}}}]';
 events := '[{"id":"b0000000-0000-4000-8000-000000000002","aggregateType":"workflow","aggregateId":"test","eventType":"WorkflowInstanceCreated","payload":{},"idempotencyKey":"pr30-domain"}]';
 -- Inject an outbox failure after domain insertion; the business row must roll back.
 begin
  perform public.platform_apply_domain_commands('rollback',commands,jsonb_set(events,'{0,payload}','null'),null);
  raise exception 'Expected outbox constraint failure';
 exception when check_violation then null; end;
 if exists(select 1 from public.workflow_instances where aggregate_id='test') or exists(select 1 from public.platform_command_receipts where command_id='rollback') then raise exception 'Partial commit'; end if;
 perform public.platform_apply_domain_commands('commit',commands,events,'{"ok":true}');
 perform public.platform_apply_domain_commands('commit',commands,events,'{"ok":true}');
 if (select count(*) from public.workflow_instances where aggregate_id='test')<>1 or (select count(*) from public.platform_outbox where idempotency_key='pr30-domain')<>1 then raise exception 'Replay duplicated data'; end if;
 begin
  perform public.platform_apply_domain_commands('injection','[{"table":"users","mode":"delete","row":{"id":"x"},"keys":["id"]}]','[]',null);
  raise exception 'Arbitrary table accepted';
 exception when raise_exception then if sqlerrm <> 'Unsupported domain command' then raise; end if; end;
 -- Stale workflow state cannot overwrite a newer decision.
 select updated_at into saved_time from public.workflow_instances where aggregate_id='test';
 commands := jsonb_build_array(jsonb_build_object('table','workflow_instances','mode','update','keys',jsonb_build_array('id'),'row',jsonb_build_object('id','b0000000-0000-4000-8000-000000000001','current_step_index',1),'expected',jsonb_build_object('current_step_index',0,'updated_at',saved_time)));
 perform public.platform_apply_domain_commands('advance',commands,'[]',null);
 begin
  perform public.platform_apply_domain_commands('stale-advance',commands,'[]',null);
  raise exception 'Stale decision accepted';
 exception when serialization_failure then null; end;
 if has_function_privilege('authenticated','public.platform_apply_domain_commands(text,jsonb,jsonb,jsonb)','EXECUTE') then raise exception 'Browser command execution'; end if;
 if has_table_privilege('authenticated','public.schemes','UPDATE') then raise exception 'Scheme write bypass'; end if;
 if has_table_privilege('authenticated','public.workflow_instances','UPDATE') then raise exception 'Workflow write bypass'; end if;
end $$;

insert into public.school_tenant_bindings values('school-a','11111111111','tenant-a','block-a','district-a','state-a',now(),'registry-owner');
do $$ begin
 begin
  insert into public.syllabus_progress(id,udise_code,subject,teacher,pct,tenant_id) values('bad','11111111111','maths','teacher',10,'tenant-b');
  raise exception 'Cross-tenant insert accepted';
 exception when raise_exception then if sqlerrm <> 'Verified school ownership required' then raise; end if; end;
 insert into public.syllabus_progress(id,udise_code,subject,teacher,pct,tenant_id) values('good','11111111111','maths','teacher',10,'tenant-a');
end $$;

select public.platform_reconcile_pfms('2026-09-25','[{"referenceId":"p1","status":"settled","settlementId":"s1"}]');
select public.platform_reconcile_pfms('2026-09-25','[{"referenceId":"p1","status":"settled","settlementId":"s1"}]');
do $$ begin
 begin
  perform public.platform_reconcile_pfms('2026-09-25','[{"referenceId":"p2","status":"processing"},{"referenceId":"p1","status":"failed"}]');
  raise exception 'Contradictory settlement accepted';
 exception when raise_exception then if sqlerrm <> 'Conflicting terminal PFMS status' then raise; end if; end;
 if exists(select 1 from public.pfms_payment_observations where reference_id='p2') then raise exception 'Partial reconciliation'; end if;
end $$;

-- Gateway observations are evidence, not authority to initiate or release money.
create table public.pfms_payment_observations (
 reference_id text primary key, status text not null check(status in ('accepted','processing','settled','failed')),
 settlement_id text, report_date date not null, observed_at timestamptz not null default now(),
 check(status <> 'settled' or settlement_id is not null)
);
create table public.pfms_reconciliation_runs (
 report_date date primary key, row_count integer not null, completed_at timestamptz not null default now()
);
alter table public.pfms_payment_observations enable row level security;
alter table public.pfms_reconciliation_runs enable row level security;
revoke all on public.pfms_payment_observations,public.pfms_reconciliation_runs from public,anon,authenticated;
grant select on public.pfms_payment_observations,public.pfms_reconciliation_runs to service_role;
create or replace function public.platform_reconcile_pfms(reconciliation_date date,payment_rows jsonb)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare r jsonb; previous public.pfms_payment_observations;
begin
 if reconciliation_date is null or jsonb_typeof(payment_rows) <> 'array' or jsonb_array_length(payment_rows)>10000 then raise exception 'Invalid reconciliation report'; end if;
 perform pg_advisory_xact_lock(78300018);
 if exists(select 1 from jsonb_array_elements(payment_rows) p group by p->>'referenceId' having count(*)>1) then raise exception 'Duplicate payment reference'; end if;
 for r in select value from jsonb_array_elements(payment_rows) loop
  if nullif(r->>'referenceId','') is null or r->>'status' is null or r->>'status' not in ('accepted','processing','settled','failed')
   or (r->>'status'='settled' and nullif(r->>'settlementId','') is null) then raise exception 'Invalid payment status'; end if;
  select * into previous from public.pfms_payment_observations where reference_id=r->>'referenceId' for update;
  if found then
   if previous.report_date > reconciliation_date then continue; end if;
   if previous.status in ('settled','failed') and (previous.status <> r->>'status' or previous.settlement_id is distinct from r->>'settlementId') then
     raise exception 'Conflicting terminal PFMS status';
   end if;
   if previous.status='processing' and r->>'status'='accepted' then raise exception 'PFMS status regression'; end if;
  end if;
  insert into public.pfms_payment_observations values(r->>'referenceId',r->>'status',r->>'settlementId',reconciliation_date,now())
   on conflict(reference_id) do update set status=excluded.status,settlement_id=excluded.settlement_id,report_date=excluded.report_date,observed_at=excluded.observed_at;
 end loop;
 insert into public.pfms_reconciliation_runs values(reconciliation_date,jsonb_array_length(payment_rows),now())
 on conflict(report_date) do update set row_count=excluded.row_count,completed_at=excluded.completed_at;
end $$;
revoke all on function public.platform_reconcile_pfms(date,jsonb) from public,anon,authenticated;
grant execute on function public.platform_reconcile_pfms(date,jsonb) to service_role;

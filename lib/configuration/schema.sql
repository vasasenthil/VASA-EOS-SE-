create table if not exists governed_configuration_proposals (
  id uuid primary key,
  version integer not null unique,
  control text not null check (control in ('maintenance_mode', 'notification_policy', 'retention_profile', 'feature_release')),
  value jsonb not null,
  tenant_scope text[] not null check (cardinality(tenant_scope) > 0),
  rationale text not null check (length(rationale) >= 15),
  reference text not null,
  risk text not null check (risk in ('low', 'medium', 'high')),
  status text not null check (status in ('submitted', 'approved', 'active', 'rejected', 'superseded')),
  proposed_by text not null,
  approved_by text,
  activated_by text,
  activation_at timestamptz,
  expires_at timestamptz,
  rollback_of uuid references governed_configuration_proposals(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposed_by is distinct from approved_by)
);

create index if not exists governed_configuration_status_idx on governed_configuration_proposals(status, version desc);
create unique index if not exists governed_configuration_one_active_control_idx on governed_configuration_proposals(control) where status = 'active';
alter table governed_configuration_proposals enable row level security;

create or replace function activate_governed_configuration(p_id uuid, p_actor text)
returns governed_configuration_proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate governed_configuration_proposals;
begin
  select * into candidate from governed_configuration_proposals where id = p_id for update;
  if candidate.id is null then raise exception 'Configuration proposal not found'; end if;
  if candidate.status <> 'approved' or candidate.approved_by is null then raise exception 'Approved proposal evidence is required'; end if;
  if candidate.activation_at is not null and candidate.activation_at > now() then raise exception 'Scheduled activation time has not arrived'; end if;
  update governed_configuration_proposals set status = 'superseded', updated_at = now() where control = candidate.control and status = 'active';
  update governed_configuration_proposals set status = 'active', activated_by = p_actor, updated_at = now() where id = p_id returning * into candidate;
  return candidate;
end;
$$;

revoke all on function activate_governed_configuration(uuid, text) from public;

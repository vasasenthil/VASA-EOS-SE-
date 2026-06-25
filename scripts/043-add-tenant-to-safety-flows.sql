-- VASA-EOS(SE) — add per-role jurisdiction scoping to the child-safety incident flow.
--
-- POCSO/child-safety cases are highly sensitive (stored with an anonymised case reference, never a
-- victim identity). The listing action now scopes results to the current subject's tenant subtree
-- (lib/access/scope-server), so a school sees only its own incidents, a block its schools', a
-- district its blocks'. This adds the tenant_id column the scoping reads. Existing rows default to
-- the demo school node. RLS remains deny-by-default.

alter table public.safety_flows
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists safety_flows_tenant_idx on public.safety_flows (tenant_id);

-- VASA-EOS(SE) — add per-role jurisdiction scoping to the RTE admissions flow.
--
-- Admission applications carry student identity, guardian PII and (on enrolment) an APAAR id. The
-- listing action now scopes results to the current subject's tenant subtree
-- (lib/access/scope-server), so a school sees only its own applicants, a block its schools', a
-- district its blocks'. This adds the tenant_id column the scoping reads. Existing rows default to
-- the demo school node. RLS remains deny-by-default.

alter table public.admission_flows
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists admission_flows_tenant_idx on public.admission_flows (tenant_id);

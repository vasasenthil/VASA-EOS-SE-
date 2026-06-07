-- VASA-EOS(SE) — per-role data scoping (ReBAC jurisdiction).
-- Adds a tenant_id column to scopable record tables so listing queries can be
-- filtered to the signed-in subject's jurisdiction subtree (school/block/district/
-- state). The application defaults tenant_id to the demo school node when absent,
-- so this migration is backward-compatible with existing rows.
--
-- Reference conversion: safety_concerns. The same pattern (add tenant_id + index)
-- applies to every scopable operational table as the rollout proceeds.

alter table if exists public.safety_concerns
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists safety_concerns_tenant_id_idx
  on public.safety_concerns (tenant_id);

alter table if exists public.incidents
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists incidents_tenant_id_idx
  on public.incidents (tenant_id);

alter table if exists public.cwsn_students
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists cwsn_students_tenant_id_idx
  on public.cwsn_students (tenant_id);

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

alter table if exists public.lost_found
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists lost_found_tenant_id_idx
  on public.lost_found (tenant_id);

alter table if exists public.cooks
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';

create index if not exists cooks_tenant_id_idx
  on public.cooks (tenant_id);

alter table if exists public.rte_applicants
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists rte_applicants_tenant_id_idx on public.rte_applicants (tenant_id);

alter table if exists public.rti_requests
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists rti_requests_tenant_id_idx on public.rti_requests (tenant_id);

alter table if exists public.oosc_children
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists oosc_children_tenant_id_idx on public.oosc_children (tenant_id);

alter table if exists public.water_tests
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists water_tests_tenant_id_idx on public.water_tests (tenant_id);

alter table if exists public.cctv_cameras
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists cctv_cameras_tenant_id_idx on public.cctv_cameras (tenant_id);

alter table if exists public.drills
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists drills_tenant_id_idx on public.drills (tenant_id);

alter table if exists public.competition_entries
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists competition_entries_tenant_id_idx on public.competition_entries (tenant_id);

alter table if exists public.excursions
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists excursions_tenant_id_idx on public.excursions (tenant_id);

alter table if exists public.tc_requests
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists tc_requests_tenant_id_idx on public.tc_requests (tenant_id);

alter table if exists public.visitors
  add column if not exists tenant_id text not null default 'TN-CHN-B1-S1';
create index if not exists visitors_tenant_id_idx on public.visitors (tenant_id);

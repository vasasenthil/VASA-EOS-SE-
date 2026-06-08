-- VASA-EOS(SE) — Row-Level Security per tenant (Multi-Tenancy isolation guarantee).
--
-- Defense-in-depth: the application already scopes every listing via
-- lib/access/scope-server (ReBAC downward governance). This migration enforces the
-- SAME rule at the DATABASE layer so that even a connection that bypasses the app
-- (a direct query, a compromised path) cannot read across tenants.
--
-- How it works: the app sets a per-request GUC `app.tenant_ids` to the comma-
-- separated set of tenant nodes the signed-in subject governs (lib/tenancy/rls
-- produces the SET LOCAL statement). The RLS policy admits a row only when its
-- tenant_id is in that set. An empty/unset GUC admits nothing (fail-closed).
--
-- NOTE: the Supabase service-role bypasses RLS by design (it is the trusted server
-- identity that runs the app's own scoping). RLS therefore protects the anon /
-- authenticated roles and any non-service connection — the threat model RLS exists
-- for. Keep both layers: app scoping is primary, RLS is the backstop.

-- Membership test: is `tid` within the current request's governed tenant set?
create or replace function public.in_tenant_subtree(tid text)
returns boolean
language sql
stable
as $$
  select tid = any (
    string_to_array(coalesce(nullif(current_setting('app.tenant_ids', true), ''), '__none__'), ',')
  );
$$;

-- Enable RLS + a SELECT policy on every tenant-scoped table (idempotent).
do $$
declare
  t text;
  scoped_tables text[] := array[
    'safety_concerns','incidents','cwsn_students','lost_found','cooks',
    'rte_applicants','rti_requests','oosc_children','water_tests','cctv_cameras',
    'drills','competition_entries','excursions','tc_requests','visitors',
    'loans','alumni','distribution','certificates','stock_movements',
    'sf_projects','guest_lectures','council_candidates','assemblies','eco_activities',
    'cadets','bank_accounts','fitness_records','readers','ict_sessions',
    'voc_enrolments','homework','mdm_register','sport_results','notices',
    'scholarships','textbook_indents','vacancy_lines','bagless_activities',
    'diagnostic_rounds','result_publications','staff_attendance_sheets',
    'seating_plans','question_papers','promotion_runs'
  ];
begin
  foreach t in array scoped_tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists tenant_isolation on public.%I;', t);
      execute format(
        'create policy tenant_isolation on public.%I for select using (public.in_tenant_subtree(tenant_id));',
        t
      );
    end if;
  end loop;
end $$;

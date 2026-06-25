-- VASA-EOS(SE) — per-role tenant scoping (ReBAC jurisdiction): add tenant_id + index to the scopable
-- operational tables so listing queries are filtered to the signed-in subject's jurisdiction subtree.
--
-- Production correction: the original migration ran bare `alter table` / `create index` against tables
-- that are CREATED IN A LATER migration (023/024), so it could never have applied against a real
-- database. It is now a single EXISTENCE-GUARDED, idempotent loop: it scopes only the tables that
-- already exist at this point, and the backfill migration (078) re-runs the same loop after every
-- table is created so each scoped table reliably gets its tenant_id column + index regardless of order.

do $$
declare
  t text;
  scoped text[] := array[
    'alumni','assemblies','bagless_activities','bank_accounts','cadets','cctv_cameras','certificates',
    'competition_entries','cooks','council_candidates','cwsn_students','diagnostic_rounds','distribution',
    'drills','eco_activities','excursions','fitness_records','guest_lectures','homework','ict_sessions',
    'incidents','loans','lost_found','mdm_register','notices','oosc_children','promotion_runs',
    'question_papers','readers','result_publications','rte_applicants','rti_requests','safety_concerns',
    'scholarships','seating_plans','sf_projects','sport_results','staff_attendance_sheets',
    'stock_movements','tc_requests','textbook_indents','vacancy_lines','visitors','voc_enrolments','water_tests'
  ];
begin
  foreach t in array scoped loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists tenant_id text not null default ''TN-CHN-B1-S1'';', t);
      execute format('create index if not exists %I on public.%I (tenant_id);', t || '_tenant_id_idx', t);
    end if;
  end loop;
end $$;

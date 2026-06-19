-- VASA-EOS(SE) — backfill the ReBAC tenant scoping AFTER every operational table exists.
--
-- Migration 018 scopes tables in numeric order, but several of the scopable tables are created later
-- (023/024). This re-runs the same existence-guarded loop once all tables are present, so every scoped
-- table reliably has its tenant_id column + index. Idempotent (column/index use IF NOT EXISTS).

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

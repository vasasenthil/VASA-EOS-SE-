-- Operator imports verified mappings first, in the same psql session:
--   public.school_tenant_bindings (all required registry verification fields)
--   TEMP TABLE pr30_scheme_ownership(id uuid primary key, jurisdiction_id text not null)
-- This transaction refuses to complete if any existing row remains unmapped.
BEGIN;
LOCK TABLE public.school_tenant_bindings IN SHARE MODE;
LOCK TABLE public.enrolment_snapshots, public.dropout_risk, public.syllabus_progress, public.schemes IN SHARE ROW EXCLUSIVE MODE;
UPDATE public.enrolment_snapshots r SET tenant_id=s.tenant_id FROM public.school_tenant_bindings s WHERE r.udise_code=s.udise_code AND r.tenant_id IS DISTINCT FROM s.tenant_id;
UPDATE public.dropout_risk r SET tenant_id=s.tenant_id FROM public.school_tenant_bindings s WHERE r.udise_code=s.udise_code AND r.tenant_id IS DISTINCT FROM s.tenant_id;
UPDATE public.syllabus_progress r SET tenant_id=s.tenant_id FROM public.school_tenant_bindings s WHERE r.udise_code=s.udise_code AND r.tenant_id IS DISTINCT FROM s.tenant_id;
UPDATE public.schemes s SET jurisdiction_id=m.jurisdiction_id FROM pr30_scheme_ownership m WHERE s.id=m.id AND s.jurisdiction_id IS NULL;
DO $$ DECLARE t text; unresolved bigint;
BEGIN
 FOREACH t IN ARRAY ARRAY['enrolment_snapshots','dropout_risk','syllabus_progress'] LOOP
  EXECUTE format('SELECT count(*) FROM public.%I r WHERE NOT EXISTS (SELECT 1 FROM public.school_tenant_bindings s WHERE s.udise_code=r.udise_code AND s.tenant_id=r.tenant_id)',t) INTO unresolved;
  IF unresolved>0 THEN RAISE EXCEPTION 'Unresolved ownership in %: % rows',t,unresolved; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.schemes WHERE jurisdiction_id IS NULL) THEN RAISE EXCEPTION 'Scheme jurisdiction backfill incomplete'; END IF;
END $$;
COMMIT;

CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
\ir ../../lib/events/outbox-schema.sql
\ir ../../lib/events/rpc/dead_letters.sql
\ir ../../lib/events/rpc/insert_with_outbox.sql
\ir ../../lib/events/rpc/update_with_outbox.sql
\ir ../../lib/events/rpc/generic_atomic.sql
\ir ../../lib/events/rpc/scholarship_file_with_outbox.sql
\ir ../../lib/events/rpc/tc_file_with_outbox.sql
\ir ../../lib/events/rpc/scheme_propose_with_outbox.sql
\ir ../../lib/ml/schema.sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
\ir ../../migrations/014_pr30_security_access.sql
\ir ../../migrations/015_pr30_outbox_retry.sql
\ir pr30-access-retry.sql

CREATE SCHEMA auth;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
\ir ../../lib/workflow-runtime/workflow-schema.sql
\ir ../../lib/schemes/schema.sql
\ir ../../scripts/037-create-enrolment-snapshots-table.sql
\ir ../../scripts/038-create-dropout-risk-table.sql
\ir ../../scripts/040-create-syllabus-progress-table.sql
\ir ../../migrations/016_pr30_domain_transactions.sql
INSERT INTO public.enrolment_snapshots(id,udise_code,as_of,total,boys,girls,tenant_id)
VALUES('legacy-enrolment','33333333333','2026-09-25',10,5,5,'legacy-demo-default');
\ir ../../migrations/017_pr30_tenant_approval.sql
\ir ../../migrations/018_pr30_pfms_reconciliation.sql
\ir pr30-domain-transactions.sql

DO $$ BEGIN
 IF (SELECT tenant_id FROM public.enrolment_snapshots WHERE id='legacy-enrolment') <> 'legacy-demo-default' THEN RAISE EXCEPTION 'Ownership was guessed during upgrade'; END IF;
END $$;
INSERT INTO public.school_tenant_bindings VALUES('school-c','33333333333','tenant-c','block-c','district-c','state-c',now(),'registry-owner');
CREATE TEMP TABLE pr30_scheme_ownership(id uuid primary key,jurisdiction_id text not null);
\ir ../../scripts/deploy/backfill-pr30-ownership.sql
DO $$ BEGIN
 IF (SELECT tenant_id FROM public.enrolment_snapshots WHERE id='legacy-enrolment') <> 'tenant-c' THEN RAISE EXCEPTION 'Verified ownership backfill failed'; END IF;
 IF (SELECT total FROM public.enrolment_snapshots WHERE id='legacy-enrolment') <> 10 THEN RAISE EXCEPTION 'Legacy record lost during backfill'; END IF;
END $$;

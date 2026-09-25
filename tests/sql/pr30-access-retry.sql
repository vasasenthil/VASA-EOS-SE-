-- Run after the manifest against an isolated PostgreSQL database.
DO $assert$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ml_models','ml_predictions','ml_outcomes','ml_drift_reports','ml_training_runs','ml_feature_snapshots'] LOOP
    IF has_table_privilege('anon', 'public.' || t, 'SELECT') OR has_table_privilege('authenticated', 'public.' || t, 'INSERT') THEN
      RAISE EXCEPTION 'ML ACL regression: %', t;
    END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || t)::regclass) THEN RAISE EXCEPTION 'RLS missing: %', t; END IF;
  END LOOP;
  IF has_function_privilege('anon', 'public.platform_generic_atomic_commit(text,jsonb,jsonb,jsonb)', 'EXECUTE') THEN RAISE EXCEPTION 'public generic execution'; END IF;
  IF has_function_privilege('authenticated', 'public.insert_with_outbox(text,jsonb,jsonb)', 'EXECUTE') THEN RAISE EXCEPTION 'authenticated generic execution'; END IF;
  IF has_function_privilege('service_role', 'public.update_with_outbox(text,uuid,jsonb,jsonb)', 'EXECUTE') THEN RAISE EXCEPTION 'legacy generic update still executable'; END IF;
END;
$assert$;

INSERT INTO public.platform_outbox(id,aggregate_type,aggregate_id,event_type,payload,idempotency_key)
VALUES ('a0000000-0000-4000-8000-000000000001','test','pr30-test','Test','{}','pr30-retry-test');
DO $retry$
DECLARE n integer; r public.platform_outbox%rowtype;
BEGIN
  FOR n IN 1..5 LOOP
    SELECT * INTO r FROM public.platform_claim_outbox_batch('pr30-worker', 1);
    IF r.id IS DISTINCT FROM 'a0000000-0000-4000-8000-000000000001'::uuid THEN RAISE EXCEPTION 'retry not claimable at %', n; END IF;
    PERFORM public.platform_mark_outbox_failed(r.id, 'pr30-worker', 'intentional failure');
    SELECT * INTO r FROM public.platform_outbox WHERE id = r.id;
    IF r.retry_count <> n THEN RAISE EXCEPTION 'wrong retry count'; END IF;
    IF n < 5 AND r.status <> 'pending' THEN RAISE EXCEPTION 'retry stranded'; END IF;
    IF n < 5 AND r.next_attempt_at <= now() THEN RAISE EXCEPTION 'missing backoff'; END IF;
    UPDATE public.platform_outbox SET next_attempt_at = now() - interval '1 second' WHERE id = r.id;
  END LOOP;
  IF r.status <> 'failed' THEN RAISE EXCEPTION 'terminal event not failed'; END IF;
  IF (SELECT count(*) FROM public.platform_outbox_dead_letters WHERE outbox_event_id = r.id) <> 1 THEN RAISE EXCEPTION 'DLQ missing or duplicated'; END IF;
  IF EXISTS (SELECT 1 FROM public.platform_claim_outbox_batch('other-worker', 1)) THEN RAISE EXCEPTION 'terminal event reclaimed'; END IF;
END;
$retry$;

INSERT INTO public.platform_outbox(id,aggregate_type,aggregate_id,event_type,payload,idempotency_key)
VALUES ('a0000000-0000-4000-8000-000000000002','test','pr30-test-2','Test','{}','pr30-success-test');
SELECT * FROM public.platform_claim_outbox_batch('owner-worker', 1);
DO $lease$
BEGIN
  BEGIN
    PERFORM public.platform_mark_outbox_processed('a0000000-0000-4000-8000-000000000002', 'wrong-worker');
    RAISE EXCEPTION 'test failed: stale owner accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'outbox lease lost' THEN RAISE; END IF;
  END;
END;
$lease$;
SELECT public.platform_mark_outbox_processed('a0000000-0000-4000-8000-000000000002', 'owner-worker');

INSERT INTO public.platform_outbox(id,aggregate_type,aggregate_id,event_type,payload,idempotency_key)
VALUES ('a0000000-0000-4000-8000-000000000003','test','pr30-transient','Test','{}','pr30-transient-test');
SELECT * FROM public.platform_claim_outbox_batch('transient-owner', 1);
SELECT public.platform_mark_outbox_failed('a0000000-0000-4000-8000-000000000003', 'transient-owner', 'transient');
UPDATE public.platform_outbox SET next_attempt_at = now() - interval '1 second' WHERE id = 'a0000000-0000-4000-8000-000000000003';
SELECT * FROM public.platform_claim_outbox_batch('recovered-owner', 1);
SELECT public.platform_mark_outbox_processed('a0000000-0000-4000-8000-000000000003', 'recovered-owner');
DO $recovered$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.platform_outbox WHERE id = 'a0000000-0000-4000-8000-000000000003' AND status = 'processed' AND retry_count = 1) THEN RAISE EXCEPTION 'transient retry did not recover'; END IF;
  IF EXISTS (SELECT 1 FROM public.platform_outbox_dead_letters WHERE outbox_event_id = 'a0000000-0000-4000-8000-000000000003') THEN RAISE EXCEPTION 'successful retry incorrectly dead-lettered'; END IF;
END;
$recovered$;

# PR30 remediation implementation — 25 September 2026

Base: `f74cecd4ea17d8b956b1c6b9219dcef6b43d3c5a` (PR #30).
This is a focused remediation branch, not approval to merge or deploy the parent PR.

## Implemented in this branch

| Original review concern | Correction | Evidence / remaining validation |
|---|---|---|
| JWT verification | Supabase Auth verifies bearer credentials; trusted app metadata supplies roles/tenant claims; demo-cookie authority removed from protected session API | Auth fixture tests reject forged tokens and user metadata escalation; real Auth issuer/audience/expiry configuration still needs staging tests |
| Privileged RPC exposure | Forward migration revokes browser/public access to generic and domain/outbox RPCs. Three unused arbitrary-table RPCs also lose service-role execution | PostgreSQL ACL assertions; checked repository consumers: generic helpers have no production call sites. Re-enable only after typed replacements or explicit allowlists |
| ML RLS | All six ML tables enable RLS and revoke browser-role privileges; service-only access retained | Database ACL/RLS assertions. Service-role APIs must still enforce tenant authorization |
| Scheme-data fallback | Both list/detail fallback paths stop querying privileged runtime stores | Source review; existing suite. Static public demo data only |
| Outbox retries | Backoff and due-time claiming; five failed attempts; atomic terminal DLQ insert; source-event uniqueness; wrong-owner acknowledgement rejected | SQL retry/ACL regression; memory retry test. Existing duplicate DLQ records cause migration failure and require operator reconciliation |
| Handler registration | Workflow, retraining, and outcome handlers wired before polling; unsubscribe on stop; outcome collector ignores its own OutcomeObserved events | Worker entrypoint smoke. Durable per-consumer idempotency remains a separate production gap |
| Migration delimiters | Raw top-level migration SQL, transactional advisory lock + ledger, SHA256 checksums, legacy checksum compatibility | Native generation tests. PostgreSQL CI runner regression added |
| Worker startup | Separate ESM entrypoint and production-only resolver; TypeScript transformation enabled; no test stubs | Actual outbox process starts on Node 24; Node 22 container validation still required. Missing PFMS worker below remains blocking |
| Web readiness | Public minimal bounded DB probe; liveness separated | Probe points at /api/ready, not protected cutover; cluster smoke remains |
| Worker probes | Actual worker HTTP health listener on port 3001 tied to successful loop progress | Real HTTP listener test. Outbox/SLA manifests corrected |
| Live heartbeat | Persist successful progress per instance; cutover reads durable live rows and ignores timestamp env vars | Stale/live heartbeat tests. Cutover requires at least one healthy instance of every mandatory group; per-pod probes cover replicas |
| Deployment images | App and worker manifests render the CI image before apply; worker deploy no longer rebuilds images | Render tests; actual registry/cluster rollout remains |
| App ServiceAccount | vasa-app ServiceAccount declared before Deployment in same manifest | Manifest check; Vault account/role integration needs staging |

## Blocking work still outstanding

1. **Domain/outbox atomicity:** DB-backed commitWithEvents still sequences independent commits. Migrate all callers to typed transaction RPCs, with command idempotency and failure-injection tests. This branch deliberately does not install the prior shutdown guard that would disable business flows.
2. **Tenant scope:** enrolment, dropout and syllabus stores still contain demo-tenant defaults. Resolve verified institution-to-tenant membership, backfill existing rows, update all callers and test two non-demo tenants. Never trust a body-supplied tenant ID.
3. **Approval state:** scheme approvals still trust client step progression. Implement a locked server-owned state transition with jurisdiction/actor authorization and transactional workflow/domain/event updates. Existing scheme direct-write RLS also needs narrowing to prevent route bypass.
4. **Missing reconciliation worker:** `infra/k8s/vasa-workers-deployment.yaml` references `lib/workers/pfms-reconciliation.worker.ts`, which does not exist at this head. There is no implemented PFMS worker to start or emit its required durable heartbeat. Implement and validate it; do not remove the heartbeat requirement to make cutover pass.
5. **Production evidence:** run the full manifest against both a clean supported DB and an upgrade snapshot, real Auth adversarial checks, Node 22 worker containers, and fresh-namespace staging rollout. PostgreSQL-compatible embedded-engine tests are not a substitute for Supabase role/configuration validation or a cluster test.

No existing review threads are auto-resolved by this branch. Keep both remediation and parent PR unmerged until the outstanding work and final-head validation are complete.

## Operational compatibility

- sessionFromJwt is now async; its repository callers and fixtures are updated.
- Protected sessions require real Auth; walkthrough-only cookies cannot authorize actions.
- ML browser access is intentionally denied; retain authorized server APIs.
- Generic arbitrary-table RPCs are intentionally disabled; no production repository consumers were found.
- Migrations 014 and 015 are forward-only. Do not alter ledgered migrations or restore public grants as a rollback.
- Worker heartbeat rows are keyed by worker group plus instance UUID. Retention cleanup for old stopped instances should be scheduled by operations; live reads filter to the current freshness window.

## Local verification completed

- Installed the unchanged lockfile using pnpm 10.34.5 (the workspace default pnpm 11 was incompatible with the repository overrides).
- TypeScript typecheck passed.
- Full repository test suite: **1,764 passed, 0 failed, 0 skipped**.
- Forward access/retry migrations and SQL ACL/retry/lease assertions executed successfully in PGlite's isolated PostgreSQL engine; the pgcrypto extension declaration was omitted only in that temporary harness because UUID generation is built in there.
- All three existing worker classes import with the production resolver. The real outbox entrypoint starts on Node 24 and fails closed without DB credentials; this was not a successful business-processing or Docker test.
- A PostgreSQL 16 CI workflow covers the SQL assertions and actual psql migration-runner rollback/rerun/checksum behavior. That new remote workflow has not yet been observed running.
- Production Next.js build passed: compilation, type validation, all 388 static pages, and build tracing completed. No live deployment was performed.

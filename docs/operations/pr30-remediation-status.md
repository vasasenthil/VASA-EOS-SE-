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
| Worker startup | Separate ESM entrypoint and production-only resolver; TypeScript transformation enabled; no test stubs | All four worker classes import on Node 22.23.3 with the production loader; container/cluster execution still requires staging |
| Web readiness | Public minimal bounded DB probe; liveness separated | Probe points at /api/ready, not protected cutover; cluster smoke remains |
| Worker probes | Actual worker HTTP health listener on port 3001 tied to successful loop progress | Real HTTP listener test. Outbox/SLA manifests corrected |
| Live heartbeat | Persist successful progress per instance; cutover reads durable live rows and ignores timestamp env vars | Stale/live heartbeat tests. Cutover requires at least one healthy instance of every mandatory group; per-pod probes cover replicas |
| Deployment images | App and worker manifests render the CI image before apply; worker deploy no longer rebuilds images | Render tests; actual registry/cluster rollout remains |
| App ServiceAccount | vasa-app ServiceAccount declared before Deployment in same manifest | Manifest check; Vault account/role integration needs staging |

## Additional implementation completed in the second correction batch

| Review concern | Implementation | Regression evidence |
|---|---|---|
| Domain/outbox atomicity | All DB-backed callback stores stage explicit domain commands; one service-only RPC commits the allowlisted mutations, command receipt and events. Raw writes inside callbacks are rejected. PostgreSQL compares expected state under lock before updates. | Outbox failure rolls back domain rows; exact replay returns saved result; stale writes and arbitrary-table commands rejected; simultaneous approval test admits one winner |
| Tenant scoping | Enrolment, dropout and syllabus resolve verified Auth postings against authoritative school bindings; all reads/writes use the resolved UDISE and tenant pair; body tenant overrides and demo defaults removed. Browser privileges revoked; ownership trigger rejects mismatched writes. | Two non-demo schools, cross-school reads, forged tenant input and cross-school syllabus update covered |
| Approval validation | Persisted current step, workflow/scheme status, required role, jurisdiction and distinct non-initiator actors checked. Expected-state comparisons prevent stale concurrent decisions. Draft edit API rejects approval/ownership changes; generic workflow endpoint cannot bypass scheme decisions. Human approvals conditionally require Cabinet, then internal system processing performs budget allocation and activation atomically. | Skip, role mismatch, self-approval, jurisdiction mismatch, replay, concurrent decisions, conditional Cabinet and system activation covered |
| Missing PFMS worker | Explicit production entrypoint, live HTTPS/HMAC configuration, bounded gateway calls, validated current/prior-day reports, transactional durable observations, terminal-state conflict checks, actual health probes and progress heartbeat | Response validation, duplicate/date checks, gateway failure, report rollback and repeat-report SQL tests |

### Deployment evidence and data prerequisites still required

These are environment/data requirements, not the four previously unfinished code implementations:

1. **Authoritative ownership import:** populate `school_tenant_bindings` with verified institution identifiers, UDISE codes, tenant hierarchy and verification provenance. Import an independently approved temporary `pr30_scheme_ownership(id,jurisdiction_id)` table, then execute `scripts/deploy/backfill-pr30-ownership.sql` with `ON_ERROR_STOP=1`. It locks affected tables, repairs known ownership and aborts if anything remains unresolved. No ownership is inferred from demo IDs. Existing in-flight workflows also require verified initiator/submission identities and jurisdiction before decisions can resume; do not invent these values.
2. **Live identity and database acceptance:** run Supabase Auth adversarial tests and PostgreSQL 16 CI; exercise the real deployment's clean/upgrade database, default grants and existing schema. The complete feature manifest and upgrade regression fixtures pass in isolated PGlite, with pgcrypto omitted only in that harness. This does not establish compatibility with an unknown production snapshot.
3. **Cluster/gateway acceptance:** start the Node 22 worker images and roll out to a fresh staging namespace; check Vault bindings, probes, durable heartbeats and a real PFMS federation-gateway report. No cluster, secrets or treasury endpoint was provided in this session.
4. **Scope of reconciliation:** the worker records and validates gateway settlement observations. It never initiates transfers or adjusts treasury balances. Matching these observations to a government's bank/ledger export requires that system's authoritative contract and data.

No review threads are auto-resolved. No merge or deployment has been performed.

## Operational compatibility

- sessionFromJwt is now async; its repository callers and fixtures are updated.
- Protected sessions require real Auth; walkthrough-only cookies cannot authorize actions.
- ML browser access is intentionally denied; retain authorized server APIs.
- Legacy arbitrary-table RPCs remain disabled. The new command RPC restricts relations, columns, operations and conflict keys to a fixed allowlist; it is executable only by service_role. A conservative transaction advisory lock serializes command batches. Measure contention before replacing it with finer-grained domain locks.
- Exact command replay is idempotent. Reusing a command/event key with different content is rejected; callers must not reuse keys for a different operation. This does not claim exactly-once external effects for arbitrary subscribers.
- Migrations 014–018 are forward-only. Do not alter ledgered migrations or restore public grants as a rollback.
- Worker heartbeat rows are keyed by worker group plus instance UUID. Retention cleanup for old stopped instances should be scheduled by operations; live reads filter to the current freshness window.

## Local verification completed for the second batch

- Full repository suite: **1,771 passed, 0 failed, 0 skipped**.
- All feature-manifest migrations execute on a clean isolated PostgreSQL-compatible PGlite engine.
- Access, retry, domain/outbox rollback, command replay, stale-state, ownership-trigger and PFMS transaction assertions pass against that engine, not only a mocked database.
- PostgreSQL 16 CI executed and passed all SQL access/retry/domain/ownership/PFMS assertions. Its migration-runner check exposed a psql exit-code defect; the mismatch branch now raises a SQL exception so ON_ERROR_STOP produces failure. The final rerun and hosted Node 22 application build are tracked in the PR.
- Standalone TypeScript typecheck passed. All four worker classes import on Node 22.23.3 with the production loader.
- The application stores were exercised through real SQL execution for scheme proposal, human approvals, atomic system allocation/activation and event replay; this passed.
- A legacy ownership fixture was preserved through upgrade and correctly backfilled only after authoritative mappings were supplied.
- Local Node 22 and Node 24 builds compiled, type-checked and generated all 388 pages, then failed while removing `.next/export` (`ENOTEMPTY`). The hosted Node 22 build result is recorded in the PR update; compilation alone is not counted as a successful build.
- No live Supabase, Kubernetes, bank/treasury or PFMS deployment was exercised.

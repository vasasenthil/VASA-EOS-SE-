# PHASE-8-PLAN · Cutover & Operations · CC-SPEC-001 §24 Phase 8, §26.8

**Phase 8 · Days 166–185 · Revision: in-progress**

Phase 8 is production cutover and operations: go-live, disaster recovery, and reliability governance. The
execution needs the commissioned sovereign infra; the operational logic is built and tested now. **Authored +
verified here** is split honestly from what **needs commissioning**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 8.1 | `cutover` (Go) — ordered, idempotent, reversible go-live runbook engine (rollback on failure) | `go test` | ✅ done |
| 8.2 | `dr` (Go) — Chennai→Coimbatore failover + non-destructive drill; RPO/RTO grading | `go test` | ✅ done |
| 8.3 | `slo` (Go) — SLO + error-budget engine; burn rate; deploy-freeze gate | `go test` | ✅ done |
| 8.4 | `runbooks/go-live.md` — go-live runbook with commissioning preconditions | review | ✅ done |
| 8.5 | ADR-0015 (operations: cutover, DR, SLO) | review | ✅ done |

Operational guarantees proven: a failed cutover step rolls back completed steps in reverse (never half-cut-
over) and a re-run resumes idempotently; a DR failover grades RPO/RTO and refuses an unhealthy standby, while
a drill changes no role; the error budget freezes deploys when spent and fast-burn is quantified.

## Requires commissioning (gated — `BLOCKERS.md`)
- **The real go-live** needs TN-SDC + DR (B-001), HSM + off-switch quorum keys (B-002), and the cluster
  (B-010). The cutover engine drives it; the steps are infra-agnostic.
- **The real DR drill** runs against the two provisioned sites with live replication telemetry (B-001/B-010).
- **Live SLO telemetry** feeds the error-budget engine from the observability stack (L2, ADR-0007).

## Exit / completion
Phase 8 is the final build phase. On commissioning (Classes A–D of `BLOCKERS.md` satisfied by the human
team), the platform executes the go-live runbook under the cutover engine, runs the DR drill to prove RPO/RTO,
and operates under the error-budget release gate. **The authorable build is complete at this gate**; what
remains is commissioning + the empirical proofs the human team performs on real infrastructure.

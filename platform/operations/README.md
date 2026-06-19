# Operations · Cutover, DR & SLO (Phase 8)

**CC-SPEC-001 · Phase-8 status: `ops-logic-built` (commissioning gated)**

The operational spine that drives production go-live, disaster recovery, and reliability governance. The
actual go-live needs the commissioned sovereign infra (TN-SDC, HSM, off-switch quorum keys, cluster); the
operational *logic* is built and tested here.

| Component | Status | Verification |
|---|---|---|
| `cutover` — ordered, idempotent, reversible go-live runbook engine (rollback on failure) (ADR-0015) | ✅ built + tested | `go test` |
| `dr` — Chennai→Coimbatore failover + non-destructive drill; RPO/RTO grading (ADR-0015) | ✅ built + tested | `go test` |
| `slo` — SLO + error-budget engine; burn rate; deploy-freeze gate (ADR-0015) | ✅ built + tested | `go test` |
| `runbooks/` — go-live, rollback, DR drill, off-switch engage (operator docs) | ✅ authored | review |
| Production go-live, real DR drill on the cluster, live SLO telemetry | ⛔ commissioning-gated | B-001 / B-002 / B-010 |

> The operational logic — a cutover engine that never leaves the platform half-migrated, a DR controller that
> grades RPO/RTO and drills non-destructively, and an error-budget engine that freezes change when
> reliability is spent — is authored and tested. Executing a real go-live needs the commissioned sovereign
> infra (B-001/B-002/B-010). Gated per `PHASE-8-PLAN.md` / Section 24; nothing live until the Section 25 DoD.

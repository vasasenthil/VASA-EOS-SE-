# ADR-0015 · Operations: cutover engine, DR failover, SLO error budgets

- **Status:** Accepted
- **Date:** Phase 8
- **Deciders:** G2 Platform Engineering, G6 Security & Compliance, G1 Sovereign Authority

## Context
CC-SPEC-001 §24 Phase 8 and §26.8 require a disciplined cutover to production, a proven disaster-recovery
posture, and reliability governance by error budget. The execution of any of these needs the commissioned
sovereign infrastructure — TN-SDC + DR (B-001), HSM + off-switch quorum keys (B-002), the cluster (B-010) —
which is gated. But the operational LOGIC that drives go-live, grades DR, and governs change is
infrastructure-agnostic and must be built and tested so that, when the infra exists, go-live is a reviewed
mechanism rather than an improvisation.

## Decision
Three stdlib-only Go modules under `platform/operations/`, plus operator runbooks:

1. **`cutover`** — an ordered go-live runbook engine. Each step has a precondition (refuse to start if the
   world is not ready), an idempotent action, a verify (prove the effect), and a rollback (compensating
   action). The engine runs steps in order; on any failure it rolls back completed steps in reverse, so the
   platform is never left half-cut-over; a re-run skips already-satisfied steps (idempotent resume). Every
   transition is audited.

2. **`dr`** — the Chennai→Coimbatore failover controller. Both sites are TN-sovereign (residency holds across
   failover, ADR-0009). A failover promotes a healthy standby and demotes the old primary, grading the
   realised data-loss window against the RPO and the promotion time against the RTO. A non-destructive DRILL
   exercises the same grading without changing any role, so DR readiness is provable on a schedule; failback
   restores the original assignment.

3. **`slo`** — the error-budget engine. An SLO sets a target over a window; the engine computes the realised
   success rate, budget consumed, burn rate (fast-burn alerting), and a DEPLOY-FREEZE verdict that blocks
   change when the budget is exhausted (the release gate). Canonical availability (99.9%) and latency SLOs are
   provided.

4. **`runbooks/`** — the operator-facing go-live (and rollback / DR-drill / off-switch) runbooks, with the
   commissioning preconditions enumerated against `BLOCKERS.md`.

## Consequences
- Go-live is a reviewed, reversible, idempotent mechanism; a failed cutover self-heals back to the prior
  state rather than stranding the platform.
- DR is provable and rehearsable before an incident, with explicit RPO/RTO grading.
- Reliability governs change: when the error budget is spent, deploys freeze automatically.
- Executing a real go-live remains gated on the commissioned sovereign infra (B-001/B-002/B-010); the logic,
  drills, and gates do not change when that infra arrives.

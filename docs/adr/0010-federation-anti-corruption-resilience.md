# ADR-0010 · Federation via resilient anti-corruption adapters

- **Status:** Accepted
- **Date:** Phase 3
- **Deciders:** G2 Platform Engineering, G4 Academic & Data Standards, G6 Security & Compliance

## Context
CC-SPEC-001 §10.6 and §20 require the platform to **federate, never duplicate**: it consumes ~21 sovereign-DPI
upstreams (NDEAR-S, APAAR, UDISE+/EMIS, DIKSHA, PFMS, DigiLocker, CBSE/TN Board, IFMS/HRMS…) as the source of
truth rather than re-keying their data. Those upstreams are outside the platform's control — they go slow,
fail, flap, and change their schemas. Two failure modes must be designed out: (1) an upstream outage
cascading into a platform outage, and (2) an upstream schema or semantic change leaking into the platform's
domain model. The reference implementation has reusable **drift-reconciliation** logic (crosswalk: PORT) but
its adapters are mock-mode seams, not resilient clients.

## Decision
L4 is built as **resilient anti-corruption adapters** over a shared reliability core, all stdlib-only Go:

1. **`resilience`** — the primitives every adapter composes: a **circuit breaker** (closed→open→half-open)
   that sheds load off a failing upstream and probes for recovery so callers fail fast; **bounded retry**
   with exponential backoff + jitter, honouring context cancellation and a retryable-error classifier (5xx
   retried, 4xx not); and **idempotency** keyed dedup so a provision/transfer replayed after a timeout does
   not double-issue. Clock/sleep are injected for deterministic tests.

2. **`reconcile`** — a faithful port of the reference drift engine. It compares an upstream record against
   the local copy field-by-field (string: match/drift/missing, with identity-critical escalation) and
   count-by-count (numeric: tolerance-aware, tighter for money than head-counts), emitting an explainable
   advisory verdict — **Reconciled / Review / Flagged**. Advisory only; a human reconciler decides (HITL).

3. **`adapters`** — concrete adapters (APAAR is the reference) that speak the upstream wire format, wrap every
   call in the resilience core, and **transform** the upstream DTO into the canonical domain model so an
   upstream field rename cannot reach inward. Exercised end-to-end against a simulated upstream (httptest):
   DTO transform, retry-on-5xx, no-retry-on-4xx, breaker-trips-on-sustained-failure, idempotent provision,
   and drift reconciliation.

## Consequences
- An upstream outage degrades one adapter, not the platform; recovery is automatic via the half-open probe.
- The domain model is insulated from upstream schema drift by the ACL transform; semantic drift is made
  visible and reasoned by `reconcile` rather than silently trusted.
- Live endpoints, credentials, and MoUs are gated on B-022; the adapter logic and resilience behaviour are
  complete and tested against simulated upstreams. Adding the next adapter (UDISE+, PFMS, DIKSHA) is a wire
  + transform + contract exercise on the same core.

# PHASE-3-PLAN · Integration & Federation (L4) · CC-SPEC-001 §10.6, §20

**Phase 3 · Days 36–60 · Revision: in-progress**

Phase 3 builds L4: the platform federates with the sovereign-DPI upstreams (NDEAR-S, APAAR, UDISE+/EMIS,
DIKSHA, PFMS, DigiLocker, CBSE/TN Board, IFMS/HRMS…) as the source of truth — "federate, never duplicate".
As before, **authored + verified here** is split honestly from what **needs live credentials/MoUs**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 3.1 | `resilience` (Go) — circuit breaker · retry w/ backoff+jitter · idempotency (§10.6) | `go test` (deterministic clock) | ✅ done |
| 3.2 | `reconcile` (Go) — field + numeric (tolerance) drift → Reconciled/Review/Flagged; PORT of the reference engine | `go test` | ✅ done |
| 3.3 | `adapters` (Go) — APAAR anti-corruption adapter on the resilience core; DTO→domain transform | `go test` vs **simulated upstream** (httptest) | ✅ done |
| 3.4 | Contracts — OpenAPI/AsyncAPI per federation (authored Phase 0; `contracts/`) | lint | ✅ present |
| 3.5 | ADR-0010 (federation anti-corruption + resilience) | review | ✅ done |

Adapter behaviours proven against a fake upstream: DTO transform, retry-on-5xx, no-retry-on-4xx, breaker
trips on sustained failure (then fails fast without touching the network), idempotent provision (no
double-issue), and drift reconciliation flags an identity-critical mismatch.

## Requires live access (gated — `BLOCKERS.md`)
- **Live endpoints + credentials + MoUs** for every upstream — NDEAR-S, APAAR, UDISE+, DIKSHA, PFMS,
  DigiLocker, DGE (B-022). The adapters are wired and tested against simulated upstreams; going live is a
  base-URL + secret + conformance-suite exercise per upstream.
- **Conformance test suites** against each real upstream run once sandbox access is granted (B-022).
- **The remaining ~20 adapters** (UDISE+, PFMS, DIKSHA, DigiLocker, …) follow the APAAR pattern on the same
  `resilience` core + a per-upstream ACL transform + contract.

## Exit / review gate
Phase 4 (AI Engines & Serving, L8) begins only when: this plan is reviewed; the GPU fleet + vLLM/Triton
serving exist (B-011); and at least the identity/federation upstreams have sandbox MoUs (B-022). **The build
stops at this gate after Phase 3's authorable deliverables.**

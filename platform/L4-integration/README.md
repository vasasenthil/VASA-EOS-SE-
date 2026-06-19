# L4 · Integration & Federation

**CC-SPEC-001 layer · Phase-3 status: `adapter-core-built` (live access gated)**

21 sovereign DPI adapters (NDEAR-S/APAAR/UDISE+/DIKSHA/PFMS/DigiLocker/CBSE/TN Board/IFMS/HRMS/MDM/ICDS…).

| Component | Status | Verification |
|---|---|---|
| `resilience` — circuit breaker · retry+backoff/jitter · idempotency (ADR-0010, §10.6) | ✅ built + tested | `go test` |
| `reconcile` — field + numeric (tolerance) drift → Reconciled/Review/Flagged (PORT) | ✅ built + tested | `go test` |
| `adapters/apaar` — anti-corruption adapter on the resilience core, DTO→domain transform | ✅ built + tested | `go test` vs simulated upstream |
| Live upstreams (APAAR/UDISE+/PFMS/DIKSHA/DigiLocker/DGE) + conformance suites | ⛔ access-gated | B-022 |
| Remaining ~20 adapters | ⛔ follow the APAAR pattern on the same core | B-022 |

> The resilient **adapter core** (resilience + reconcile + the APAAR reference adapter) is authored and tested
> end-to-end against a simulated upstream. Going live is a base-URL + secret + conformance exercise per
> upstream (B-022). Gated per `PHASE-3-PLAN.md` / Section 24; nothing live until the Section 25 DoD passes.

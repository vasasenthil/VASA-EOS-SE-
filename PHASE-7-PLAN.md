# PHASE-7-PLAN · Surfaces & Scale (L10) · CC-SPEC-001 §10.3, §10.6, §10.8

**Phase 7 · Days 141–165 · Revision: in-progress**

Phase 7 builds L10: the role surfaces and the scale spine that makes them survivable at ~1.27 Cr students /
~69,000 schools. The empirical 1-crore proof needs the dedicated load rig; the capacity model, rate limiter,
and load scenarios are built and tested now. **Authored + verified here** is split honestly from what **needs
the cluster/rig**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 7.1 | `capacity` (Go) — analytical planner: sizes + validates a topology for 1.27 Cr / 69k schools | `go test` | ✅ done |
| 7.2 | `ratelimit` (Go) — per-key token bucket + admission control / load shedding | `go test` (deterministic clock) | ✅ done |
| 7.3 | `loadmodel` (Go) — §10.8 scenarios (1 Cr × 1h · 2 Cr surge · 72h soak) + arrival-shape model | `go test` | ✅ done |
| 7.4 | Surfaces: 13 portals + RN/PWA (RE-AUTHOR of the reference app UX) | reference UX is the port source | ⏳ cluster-gated |
| 7.5 | ADR-0014 (surfaces scale spine) | review | ✅ done |

Scale posture: the architecture is **sized by model and the sizing is tested** (1.27 Cr → 17 shards / 207 app
nodes / 67 DB nodes at the modelled per-unit capacities, 30% headroom); the surge-survival mechanisms (fair
per-tenant rate limiting + load-shedding admission control) are tested; the exact rig scenarios are defined.

## Requires the substrate (gated — `BLOCKERS.md`)
- **The empirical 1-crore proof** runs the `loadmodel` scenarios on the dedicated load rig (k6, B-032)
  against the cluster (B-010). The model and the rig use the same numbers; the rig confirms the model.
- **The 13 portal apps + RN/PWA** RE-AUTHOR the reference app's UX; building/hosting needs the cluster (B-010)
  and the serving fleet (B-011).
- **72-hour soak + chaos GameDay** run on the cluster with LitmusChaos (B-010, the L2 chaos harness).

## Exit / review gate
Phase 8 (Cutover & Operations — production go-live, DR drill, runbooks) begins only when: this plan is
reviewed; the cluster + rig exist (B-010/B-032); the model's sizing is confirmed by a rig run; and the
sovereign infra (TN-SDC, HSM, off-switch quorum keys) is commissioned (B-001/B-002). **The build stops at this
gate after Phase 7's authorable deliverables.**

# L10 · Surfaces & Scale

**CC-SPEC-001 layer · Phase-7 status: `scale-spine-built` (cluster + load-rig gated)**

13 role portals (~408 routes) + RN/PWA; scale to ~1.27 Cr students / ~69,000 schools, surge-proven. The
reference Next.js app is the UX PORT source; this phase builds the **scale spine** that makes the surfaces
survivable at TN scale.

| Component | Status | Verification |
|---|---|---|
| `capacity` — analytical planner: sizes + validates a topology for 1.27 Cr / 69k schools (ADR-0014) | ✅ built + tested | `go test` |
| `ratelimit` — per-key token bucket + admission control / load shedding (ADR-0014) | ✅ built + tested | `go test` |
| `loadmodel` — §10.8 scenarios (1 Cr × 1h · 2 Cr surge · 72h soak) + arrival-shape model | ✅ built + tested | `go test` |
| 13 portal apps + RN/PWA surfaces (RE-AUTHOR of the reference app's UX) | ⛔ build/host gated | B-010 |
| Empirical 1-crore load PROOF | ⛔ rig-gated | B-032 |

> The **scale spine** (capacity model + rate limiter + load scenarios) is authored and tested. It sizes the
> topology and protects the platform under surge; the EMPIRICAL 1-crore proof runs the `loadmodel` scenarios
> on the dedicated load rig (B-032) against the cluster (B-010). Gated per `PHASE-7-PLAN.md` / Section 24;
> the scale claim is "validated by model, pending rig" — not faked.

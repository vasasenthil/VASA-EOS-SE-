# ADR-0014 · Surfaces scale spine: capacity model, rate limiting, load scenarios

- **Status:** Accepted
- **Date:** Phase 7
- **Deciders:** G2 Platform Engineering, G6 Security & Compliance

## Context
CC-SPEC-001 §10.3, §10.6 and §10.8 require the platform to serve Tamil Nadu's full school system — ~1.27
crore students / ~69,000 schools — with surge tolerance, and to PROVE it (k6 1-crore × 1-hour, 2-crore surge,
72-hour soak). The empirical proof needs the dedicated load rig (BLOCKERS B-032) and the cluster (B-010),
which are gated. But the design-time gate that the rig later confirms — sizing the topology, the runtime
mechanisms that make a surge survivable, and the scenario definitions themselves — is buildable and testable
now. "Scale-proven" must not be asserted; it must be modelled here and measured there.

## Decision
Three stdlib-only Go modules under `platform/L10-surfaces/` forming the **scale spine**:

1. **`capacity`** — an analytical planner. From a load (population, peak-concurrency, RPS/user, surge factor)
   it computes peak/surge RPS and SIZES the topology (shards by data volume, app nodes by surge RPS, DB nodes
   by shard × replication), all with a 30% headroom, and VALIDATES a proposed topology against the
   requirement. The canonical TN load is encoded and tested (1.27 Cr → 17 shards / 207 app nodes / 67 DB
   nodes at the modelled per-unit capacities), so the architecture is sized before a node is provisioned.

2. **`ratelimit`** — the surge-survival mechanisms: a per-key token-bucket limiter (fair-shares tenants/users
   so one cannot starve others) and a global admission controller (a bounded in-flight semaphore that SHEDS
   load — "try later" — rather than collapsing when saturated). The clock is injected for deterministic tests.

3. **`loadmodel`** — the §10.8 scenarios (1-crore hour, 2-crore surge, 72-hour soak) as staged ramps, with a
   deterministic arrival-shape model (active VUs at any instant). These are the exact scenarios the rig
   executes; the model lets capacity planning consume the peak and lets a scenario's shape be validated now.

## Consequences
- The scale claim is honest: "validated by model, pending the empirical rig run" — the model is the
  design-time gate, the rig (B-032) is the proof, and the two use the same numbers.
- A surge cannot collapse the platform: excess load is shed and tenants are fair-shared at the gateway.
- The 13 portal surfaces RE-AUTHOR the reference app's UX onto this spine; building/hosting them is gated on
  the cluster (B-010). The capacity model and load scenarios do not change when the surfaces are built.

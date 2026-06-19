# QUESTION-0001 · Reference build vs. CC-SPEC-001, and infrastructure provisioning

**Context.** The repo holds a working single-stack reference implementation; CC-SPEC-001 demands a polyglot,
distributed, sovereign-infra production DPI verified at 1 crore concurrent. Phase 0 (governance + skeleton +
Rego policy plane + crosswalk) is done and producible here. Phases 1–8 require infrastructure, GPUs, a chain
network, sovereign data centres, and a multi-disciplinary org with the G1–G7 sign-offs and three-reviewer PRs
the spec mandates (BLOCKERS Classes A–D).

**Choice space.**
1. **Provision Phase-1 substrate** (a K8s cluster + the datastores + Keycloak/OPA/SpiceDB) so the spec build
   can begin in earnest — then the policy plane executes in CI and L2/L3/L5 start.
2. **Continue Phase-0 breadth without infra** — generate the full 391-module catalogue, all OpenAPI/AsyncAPI
   contracts, the complete Rego corpus, and ADRs, so a future team starts from a fully-specified skeleton.
3. **Treat the reference impl as the deliverable** and stop the spec build (reverses the standing instruction).

**Recommendation:** (2) until infrastructure exists, then (1). Rationale: (2) is the maximal value extractable
without the substrate and keeps the build honest; (1) is gated entirely on decisions and capital that only the
State/VASA org controls. (3) is not recommended — it conflates a reference with a production system.

**Risk of each.** (1): commits real spend before contracts/sign-offs. (2): produces specification mass that a
team must still implement. (3): mis-sets expectations about production-readiness.

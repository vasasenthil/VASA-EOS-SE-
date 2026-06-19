# L1 · Sovereign Foundation

**CC-SPEC-001 layer · Phase-1 status: `core-services-built` (substrate-gated)**

State-controlled compute/storage/network · TN data residency · HSM root-of-trust · off-switch-svc (M-of-N) · source-code escrow agent. **Substrate (HSM, TN-SDC) still gated — see BLOCKERS.md.**

| Component | Status | Verification |
|---|---|---|
| `off-switch-svc` — sovereign disable, M-of-N ed25519 quorum, replay-safe, audited (ADR-0006) | ✅ built + tested | `go test` 7/7 |
| `escrow-agent` — deterministic verifiable source-escrow manifest + Merkle root (ADR-0006/§27) | ✅ built + tested | `go test` 4/4 |
| HSM root-of-trust, TN State Data Centre residency | ⛔ substrate-gated | B-001 / B-002 |

> The sovereign-foundation **service logic** (above) is authored and tested here with ephemeral test keys.
> Production quorum/root keys are issued by the State HSM/PKI at deploy (B-002). Remaining infrastructure is
> gated per `PHASE-1-PLAN.md` / Section 24 and `BLOCKERS.md`; nothing is claimed live until its phase passes
> the Section 25 Definition of Done.

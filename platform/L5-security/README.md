# L5 · Security & Compliance

**CC-SPEC-001 layer · Phase-2 status: `data-plane-built` (identity substrate-gated)**

Keycloak · OPA/Rego · SPIRE · Vault · mTLS · immutable audit · zero-trust.

| Component | Status | Verification |
|---|---|---|
| `policies/` — Rego/OPA corpus (RBAC/ReBAC/ABAC/PBAC + regulatory + data) | ✅ built (Phase 0) | `opa test` 28/28 |
| `pep` — Policy Enforcement Point over `data.vasa.decision`, fail-closed (ADR-0008) | ✅ built + tested | `go test` + live OPA |
| `kms` — envelope encryption, per-tenant KEK hierarchy, rotation (ADR-0008, §17.4) | ✅ built + tested | `go test` |
| `audit` — immutable hash-chain + Merkle root (ADR-0008, §17.6) | ✅ built + tested | `go test` |
| Keycloak (AAL2/3), SPIRE/SPIFFE identity, Vault, mTLS issuance | ⛔ substrate-gated | B-002 / B-010 |

> The security **data-plane** (PEP + KMS + audit) is authored and tested with ephemeral keys. Production key
> material and workload identity are issued by the State HSM/PKI and the mesh (B-002/B-010). Gated per
> `PHASE-2-PLAN.md` / Section 24; nothing live until its phase passes the Section 25 Definition of Done.

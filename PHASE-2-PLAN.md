# PHASE-2-PLAN · Data Fabric & Security (L3 + L5) · CC-SPEC-001 §18, §17, §8

**Phase 2 · Days 15–35 · Revision: in-progress**

Phase 2 builds the **runtime data-plane** that enforces the Phase-0 policy plane: the security enforcement
services (L5) and the data-fabric routing + transactional core (L3). As in Phase 1, what is **authored +
verified here** is split honestly from what **requires the substrate**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 2.1 | `pep` (Go) — Policy Enforcement Point over `data.vasa.decision`; fail-closed; single source of truth | `go test` incl. **live OPA** integration (permit/deny/require-approval) | ✅ done |
| 2.2 | `kms` (Go) — envelope encryption, per-tenant KEK hierarchy, rotation, crypto-shred (§17.4) | `go test` (isolation, AAD, tamper, rotation) | ✅ done |
| 2.3 | `audit` (Go) — immutable hash-chain + Merkle root; detects tamper/delete/truncate/reorder (§17.6) | `go test` | ✅ done |
| 2.4 | `dataplane` (Go) — classification → store/region routing → retention; residency fail-closed (§18.3) | `go test` + **policy-parity** vs OPA | ✅ done |
| 2.5 | Citus core OLTP schema — tenant-sharded, `FORCE` RLS, append-only audit, PII envelopes | applied to **PostgreSQL 16**; RLS isolation proven as non-superuser | ✅ done (vanilla subset) |
| 2.6 | CI: `.gitlab-ci/templates/go.yml` (gofmt · vet · go test w/ OPA · DDL apply) | template | ✅ done |
| 2.7 | ADR-0008 (security data-plane), ADR-0009 (data fabric) | review | ✅ done |

A real outcome of the parity gate: it **caught a policy bug** (residency denied the in-state DR region) which
was fixed in `policies/data/residency.rego` (now all TN-sovereign regions); OPA suite 28/28.

## Requires the substrate (gated — `BLOCKERS.md`)
- **Citus distribution** (`002_distribution.sql`) needs a Citus cluster (coordinator + workers) — B-013.
- **The other polyglot stores** (ClickHouse, Cassandra, MinIO/Iceberg, Neo4j, Milvus, Redis) are routed-to by
  `dataplane` but provisioned with the cluster — B-013.
- **KMS root key** is an HSM handle (B-002); **PEP workload identities** are SPIFFE/Vault-issued on the mesh
  (B-010); **audit anchoring** is to the Besu notary network (B-020). Service logic is complete + tested with
  ephemeral material.
- **OPA at runtime** is a sidecar/daemon over HTTP; here the PEP/parity tests drive the same corpus via the
  `opa` CLI (B-023 resolved by source build).

## Exit / review gate
Phase 3 (Integration & Federation, L4) begins only when: this plan is reviewed; the cluster + Citus exist
(B-013/B-010); the State HSM issues the KMS root (B-002); and sovereign-DPI credentials/MoUs are granted
(B-022). **The build stops at this gate after Phase 2's authorable deliverables.**

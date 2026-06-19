# PHASE-6-PLAN · Knowledge, Notary & Verifiable Credentials (L7) · CC-SPEC-001 §7.2, §16, §20

**Phase 6 · Days 116–140 · Revision: in-progress**

Phase 6 builds the L7 **verifiability spine**: the curriculum knowledge graph, the blockchain-notary anchoring
ledger, and verifiable credentials. The substrate (Neo4j/Milvus, the Besu validator network) is gated; the
graph, ledger, and credential cryptography are built and tested now. **Authored + verified here** is split
honestly from what **needs the store/validators**.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 6.1 | `graph` (Go) — curriculum KG: prerequisites, topo learning path, readiness, cycle-safe (PORT) | `go test` | ✅ done |
| 6.2 | `notary` (Go) — Merkle-anchoring hash-chain ledger + inclusion proofs (the Besu seam, 7.2) | `go test` | ✅ done |
| 6.3 | `credentials` (Go) — ed25519 verifiable credentials anchored to the notary, end-to-end verify | `go test` | ✅ done |
| 6.4 | ADR-0013 (knowledge graph + notary + verifiable credentials) | review | ✅ done |

Guarantees proven: a Merkle inclusion proof verifies a credential's notarisation and a forged/substituted leaf
fails; any ledger tamper or broken chain link is detected; a credential's signature breaks on any claim
change or wrong issuer key; the learning path is topologically correct and prerequisite cycles are rejected.

## Requires the substrate (gated — `BLOCKERS.md`)
- **Hyperledger Besu validator network** (CAG / IIT-M / Anna Univ) for live anchoring — B-020. The notary
  submits its block roots; the ledger logic + inclusion proofs are unchanged.
- **Neo4j** property-graph store (the graph persists behind the same interface) + **Milvus** vectors for
  RAG/grounding — B-013.
- **DigiLocker** live credential push — B-022.

## Exit / review gate
Phase 7 (Surfaces & Scale — L10, 1-crore load) begins only when: this plan is reviewed; the cluster + serving
exist (B-010/B-011); the Besu network has MoUs (B-020); and the load-test rig is provisioned (B-032). **The
build stops at this gate after Phase 6's authorable deliverables.**

# L7 · Knowledge, Notary & Verifiable Credentials

**CC-SPEC-001 layer · Phase-6 status: `verifiability-spine-built` (store + validator gated)**

Knowledge graph (curriculum/ontology) · Hyperledger Besu notary (7.2) · verifiable credentials · vector
retrieval. Under human authority; tamper-evident and independently verifiable.

| Component | Status | Verification |
|---|---|---|
| `graph` — curriculum knowledge graph: prerequisites, topological learning path, readiness, cycle-safe (ADR-0013) | ✅ built + tested | `go test` |
| `notary` — Merkle-anchoring hash-chain ledger + inclusion proofs (the Besu seam, 7.2) (ADR-0013) | ✅ built + tested | `go test` |
| `credentials` — ed25519 verifiable credentials anchored to the notary, end-to-end verify (ADR-0013) | ✅ built + tested | `go test` |
| Neo4j property-graph store + Milvus vectors (RAG) | ⛔ cluster-gated | B-013 |
| Hyperledger Besu validator network (CAG/IIT-M/Anna Univ) | ⛔ MoU-gated | B-020 |
| DigiLocker live credential push | ⛔ MoU-gated | B-022 |

> The **verifiability spine** — knowledge graph + notary anchoring + verifiable credentials — is authored and
> tested with ephemeral keys and a local verifiable ledger. The notary submits its block roots to the Besu
> validator network in production (B-020); the graph persists in Neo4j (B-013); credentials push to DigiLocker
> (B-022). Gated per `PHASE-6-PLAN.md` / Section 24; nothing live until the Section 25 Definition of Done.

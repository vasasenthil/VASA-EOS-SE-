# ADR-0013 · Knowledge graph, blockchain notary, and verifiable credentials

- **Status:** Accepted
- **Date:** Phase 6
- **Deciders:** G4 Academic & Data Standards, G6 Security & Compliance, G2 Platform Engineering

## Context
CC-SPEC-001 §7.2, §16 and §20 require: a curriculum knowledge graph that sequences learning; a blockchain
notary (Hyperledger Besu, validators incl. CAG / IIT-M / Anna Univ) that anchors trust roots so they cannot
be rewritten even by the platform operator; and verifiable, portable credentials (marksheets, certificates)
the citizen holds and any party can verify. The substrate — Neo4j/Milvus (B-013) and the Besu validator
network (B-020) — is gated, but the graph logic, the verifiable-ledger logic, and the credential cryptography
are model- and store-agnostic and buildable now.

## Decision
Three stdlib-only Go modules under `platform/L7-knowledge/` forming a **verifiability spine**:

1. **`graph`** — the curriculum knowledge graph (PORT of the reference graph). Concepts with directed
   prerequisite edges; it computes transitive prerequisites, a deterministic topologically-ordered learning
   path, and a readiness check, and rejects unlearnable prerequisite cycles at construction. The production
   property graph is Neo4j behind the same interface (B-013).

2. **`notary`** — an append-only, hash-chained ledger where each block commits to a Merkle root over the
   items anchored in it and to the previous block's hash. Anchored trust roots (the L5 audit Merkle root,
   credential hashes, fund attestations) get a **Merkle inclusion proof** a verifier checks against the block
   root without trusting the ledger; `Verify` detects any tamper or broken link. In production the block
   roots are submitted to the Besu validator network (B-020); this is the verifiable-ledger core + that seam.

3. **`credentials`** — a credential is ed25519-signed by the issuing authority over its canonical
   (sorted-key) bytes and its hash is anchored via `notary`. End-to-end `Verify` confirms the issuer
   signature, that the inclusion proof's leaf is exactly this credential's hash (binding proof to
   credential), and that the proof validates — so a credential cannot be forged, altered, or claimed
   anchored when it was not. This is the DigiLocker-shaped path (live push gated on B-022).

## Consequences
- Trust is verifiable end-to-end and independent of the operator: anyone can prove a credential was issued by
  the authority and notarised at a point in time, and detect any tampering.
- Learning sequencing has a tested, cycle-safe substrate the personalisation engine consumes.
- Going live is a wiring exercise: the notary submits to Besu (B-020), the graph persists in Neo4j (B-013),
  credentials push to DigiLocker (B-022). The cryptographic guarantees do not change.

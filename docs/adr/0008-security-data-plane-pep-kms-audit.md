# ADR-0008 · Security data-plane: PEP, envelope KMS, immutable audit

- **Status:** Accepted
- **Date:** Phase 2
- **Deciders:** G6 Security & Compliance, G2 Platform Engineering

## Context
CC-SPEC-001 §8 and §17 require zero-trust enforcement at every protected surface, encryption of PII at rest
under sovereign keys, and a tamper-evident audit of every governance-significant action. Phase 0 authored the
**policy plane** (Rego/OPA, `policies/`); Phase 2 must build the **runtime data-plane** that enforces it,
without reintroducing the reference implementation's anti-patterns (access rules in TypeScript, fail-open
gaps, mutable logs — ADR-0005).

## Decision
Three stdlib-only Go services under `platform/L5-security/`:

1. **`pep`** — the Policy Enforcement Point library every surface embeds (gateway, mesh, app, DB, object
   store, bus). It builds the canonical decision input and asks the PDP (`data.vasa.decision`, the composed
   deny-wins → require-approval → permit Rego) for an effect. **Single source of truth:** no access rule
   lives in Go. **Fail-closed:** any decider error, malformed result, or unknown effect yields DENY. An
   `OPADecider` evaluates the real corpus; integration tests prove the PEP and the Rego plane agree on
   teacher-marks (permit), expel-a-9yo (deny, RTE §16), EWS-reject (require-approval), minor-PII-no-consent
   (deny, DPDP §9).

2. **`kms`** — envelope encryption with a three-tier key hierarchy: HSM **root** (B-002 seam) → per-tenant
   **KEK** (HKDF-derived, deterministic) → per-object **DEK** (AES-256-GCM). Properties proven by test:
   tenant isolation (one tenant's KEK cannot unwrap another's DEK), context binding (AAD), tamper detection
   (GCM), crypto-shredding, and **envelope rotation** (re-wrap the DEK under a new KEK generation without
   re-encrypting bulk data).

3. **`audit`** — append-only hash-chain. Each record commits to the previous record's hash; `Verify`
   re-walks the chain and detects modification, deletion, truncation, and reordering. A Merkle root over the
   records is the single commitment anchored to the external notary network (Besu, B-020) so even the
   operator cannot rewrite history undetectably.

## Consequences
- Enforcement is uniform and provable: the same composed policy decides at every PEP, and it can never fail
  open. The Rego corpus is operational, not decorative.
- PII at rest is sovereign-key-protected with per-tenant isolation and rotation that does not require
  re-encrypting data; dropping a tenant's KEK is a lawful erasure primitive.
- The audit is independently verifiable and externally anchorable.
- Production key material (KMS root, PEP-issued workload identities, audit anchoring) is issued by the State
  HSM/PKI and the Besu network — gated on B-002/B-020; the service logic is complete and tested here.

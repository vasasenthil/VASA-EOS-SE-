# ADR-0004 · Sovereignty-by-construction posture

- **Status:** Accepted
- **Date:** Phase 0
- **Deciders:** G5 Tech Architecture Board, G7 External Audit

## Context
CC-SPEC-001 §2.1 makes sovereignty inviolable: Tamil Nadu owns the data, the keys (HSM), the source code
(escrow), and the off-switch (T0). No vendor SaaS may host a primary data store; no third party receives bulk
PII; State-controlled compute for all AI inference on minor data.

## Decision
- Every datastore, key, and inference path is **State-resident by contract**. Cloud-native APIs used in the
  build must have a sovereign-equivalent fallback (§26.12); where impossible (a specific Govt API), the
  dependency and fallback are documented.
- The HSM root-of-trust, off-switch-svc (M-of-N), and escrow agent are L1 deliverables, blocked on B-002/B-003.
- The Phase-0 reference impl's reliance on a managed Supabase seam is acceptable for the REFERENCE only; the
  production data fabric (L3) is sovereign Postgres+Citus on TN-SDC. This is recorded so it is never confused
  with a compliant production store.

## Consequences
- Sovereignty is a CI-checkable property at deploy time (data-residency policy in `policies/data/residency.rego`),
  not a slogan. The sovereign attestation (§27) is produced only after L1 exists.

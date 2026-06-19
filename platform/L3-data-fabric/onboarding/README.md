# onboarding — the §B.6 twelve-step gate

The single chokepoint every record passes before it enters the data fabric (DAT-TN-001 §B.6). *No datum enters
except through this L4→L5 gate; there are no "side doors."* On any step failure the record is **quarantined
(not lost)** and the source steward + Compliance Lead are alerted.

## The pipeline (in order)
1. **Schema validation** — JSON Schema / AVRO / Protobuf; drop on mismatch
2. **Authenticity** — source signature verified; drop on signature fail
3. **Rate / shape** — per-source rate budget; per-record shape rules
4. **Data classification** — PII level 1–4; POCSO-aware content check
5. **Consent check** — DPDP lawful basis present; consent valid + not expired
6. **Residency enforce** — Class-1/2 PII only in a TN-sovereign region; egress denied
7. **Tenant resolution** — explicit T0–T6 tenant id
8. **Policy gate** — OPA Rego decision: allow / deny / quarantine
9. **Encrypt-at-rest** — per-tenant DEK; field-level for PII
10. **Persist** — routed to the canonical store per classification
11. **Audit-log** — append-only record with hash + notarisation
12. **Emit** — downstream event; CDC to lakehouse

## Implementation
Each step is a seam (interface), so the engine is tested standalone (9 tests) and wired to the **real**
platform layers in `platform/integration/onboarding.go`: dataplane (classification + residency), the PEP
(policy gate), KMS (encrypt-at-rest), audit (audit-log), notify (steward alert). `Platform.Onboard` runs it;
`platformd POST /onboard` exposes it. Verified: a clean Class-3 record passes all 12 steps; Class-1 PII
offshore is **quarantined at residency** with a steward alert; Class-2 PII without a lawful basis is
quarantined at consent; an unsigned external record is quarantined at authenticity.

# ADR-0003 · Policy plane is Rego/OPA (not embedded business logic)

- **Status:** Accepted
- **Date:** Phase 0
- **Deciders:** Security & Compliance (G6)
- **Supersedes (in the spec build):** the reference implementation's TypeScript policy engine (`lib/policy-engine`, `lib/access/policy`)

## Context
CC-SPEC-001 §2.9, §8 and §20 require that **all** access and regulatory decisions are **Rego (Open Policy
Agent)** — versioned, signed (Cosign), 100%-tested, served by an OPA bundle service, and pulled by every PEP
(Kong, Istio, application middleware, PostgreSQL RLS, MinIO, Kafka). The reference implementation enforces the
same *logic* (RBAC/ABAC/ReBAC/PBAC + RTE/RPwD/DPDP/POCSO/PFMS) but in **TypeScript inside the app** — a §2.9
violation for production (business logic must not embed an access rule).

## Decision
- The production policy plane is authored as Rego under `policies/` (`access/`, `regulatory/`, `data/`, `ai/`)
  with OPA unit tests under each and `policies/tests/`.
- Phase 0 authors the foundational bundles (rbac, rebac, abac, pbac; rte, dpdp, rpwd, pocso, pfms_gfr) and
  their tests **in valid `opa test` format**. They are not yet executed in CI: the OPA binary cannot be
  fetched in this environment (`BLOCKERS.md` B-023). CI templates include the `opa test` / `conftest` stage so
  execution turns on the moment the binary is available.
- The reference TS policy engine remains as a **port reference and a parallel oracle** for the Rego: the Rego
  bundles must reproduce its decisions (a future contract test asserts parity).

## Consequences
- The spec-correct technology choice is made now; the logic already exists and is mirrored, lowering risk.
- ReBAC graph relations (parent↔child, teacher↔class) move from in-app scope logic to **SpiceDB** fronted by
  OPA (Phase 2); Phase-0 `rebac.rego` documents the composition contract.

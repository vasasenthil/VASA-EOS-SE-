# ADR-0001 · Monorepo and relationship to the existing reference implementation

- **Status:** Accepted
- **Date:** Phase 0
- **Deciders:** Chief Architect (G5)

## Context
CC-SPEC-001 §11 mandates a polyglot monorepo (`platform/`, `ai/`, `surfaces/`, `modules/`, `policies/`, …)
on Nx with Go/Rust/Python/TypeScript/Solidity/Rego. The repository already contains a **working single-stack
reference implementation** — a Next.js 15 + TypeScript application with ~408 routes, a single Postgres seam,
deterministic AI analogues, ~1,544 tests, and a provable `scripts/bootstrap.sql`. The reference impl is *not*
the spec system, but it encodes a large amount of correct **domain logic** (admissions, grievance, scholarship,
SMC, outcomes/equity, federation reconciliation, RTE/RPwD/DPDP/POCSO/PFMS rules, the 12-layer/control-tower
registers).

## Decision
1. Adopt the §11 monorepo skeleton **additively** in this repository. The spec directories are created
   alongside the existing `app/`, `lib/`, `components/` of the reference implementation.
2. The reference implementation is **re-designated** as the **`surfaces/` (L10) UX + domain-logic PORT SOURCE**,
   not as a layer in itself. It is preserved, frozen for *deepening* (per standing instruction), and mined for
   port material via `docs/CC-SPEC-001-CROSSWALK.md`.
3. The production layers (L1–L9, L11–L12) are built fresh per spec in their `platform/`, `ai/`, `governance/`,
   `civic/` homes when the infrastructure in `BLOCKERS.md` exists.

## Consequences
- No working code is discarded; the crosswalk guarantees domain logic is ported, not lost.
- The repo temporarily holds two paradigms (reference Next.js app + spec monorepo skeleton). This is explicit
  and bounded: the reference app does not grow; the spec skeleton fills as phases pass.
- A future ADR may extract the reference app into `surfaces/portal-*` apps once L5/L6 (real auth, OPA) exist.

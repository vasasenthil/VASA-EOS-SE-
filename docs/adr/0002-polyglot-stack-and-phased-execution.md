# ADR-0002 · Polyglot stack adoption & phased execution against environment limits

- **Status:** Accepted
- **Date:** Phase 0
- **Deciders:** Chief Architect (G5), PMU (G4)

## Context
CC-SPEC-001 §9 fixes a definitive polyglot stack (Go 1.22+, Rust 1.79+, Python 3.12+, TypeScript 5.5+,
Java 21, Solidity, Rego) and §10 fixes a 1-crore-concurrent engineering constraint verified by k6/chaos/soak.
The Phase-0 build environment has **no Docker daemon, no Kubernetes, no GPUs, no HSM, restricted egress, and is
ephemeral** (`BLOCKERS.md`, Classes A–C).

## Decision
- Accept §9 as the **target stack of record**; do not substitute technologies.
- Execute only what is **producible without that substrate** in Phase 0: governance docs, the §11 skeleton,
  the compliance matrix, the module catalogue, the **Rego policy plane (authored + unit-tested)**, CI
  templates, and the crosswalk.
- Defer all stack instantiation (clusters, datastores, LLM serving, chain, IoT, IAM deployment) to Phases 1–8,
  each unblocked by its `BLOCKERS.md` entry.
- The verification gates of §10.8 and §21 are written into CI templates now; they run when the substrate exists.

## Consequences
- Phase 0 is honest: it ships the artefacts the spec's review gate (Cover STEP 4) checks, and flags — does not
  fake — the substrate it cannot create.
- "Production-ready / 1 Cr / not a pilot" remains a *phased outcome*, not a Phase-0 claim. Anyone reading the
  repo can see exactly which phase each capability belongs to.

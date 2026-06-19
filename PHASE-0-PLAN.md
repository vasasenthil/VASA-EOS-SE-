# PHASE-0-PLAN · CC-SPEC-001 · VASA-EOS(SE) TN

**Phase 0 · Bootstrap (CC-SPEC-001 §24) · Revision: in-progress · Posture: scrutiny, not trust**

Per CC-SPEC-001 cover STEP 3, Phase 0 is executed and the build **stops here for human review**. Phases
1–8 require infrastructure and a multi-disciplinary engineering organisation that this environment cannot
stand up (see `BLOCKERS.md`); they are planned, not executed.

## Context the reviewer must hold
The existing repository is a **working single-stack reference implementation** (Next.js 15 + one Postgres
seam) — *not* the CC-SPEC-001 production DPI. By the spec's own Non-Negotiables (§2: no demo mode, polyglot
distributed stack, Rego/OPA, 1-crore load), the reference impl's demo-mode/analogue posture is **non-compliant
for production**. Phase 0 establishes the spec-true scaffolding, governance, and policy plane, and a crosswalk
so the reference impl's *domain logic* can be ported, not lost. See `ADR-0001`.

## Phase 0 deliverables (CC-SPEC-001 §24 + §26)

| # | Deliverable | Owner (spec role) | Acceptance criterion | Status |
|---|---|---|---|---|
| 0.1 | Monorepo skeleton (§11 directory tree, per-layer READMEs with status) | Chief Architect (G5) | Every §11 dir exists with a status-bearing README | ✅ done |
| 0.2 | ADR system — `DECISIONS.md` index + `docs/adr/NNNN-*.md` | Chief Architect (G5) | ≥5 foundational ADRs; immutable; superseding recorded | ✅ done |
| 0.3 | `BLOCKERS.md` — infra/team/compute dependencies that gate Phases 1–8 | PMU (G4) | Every non-provisionable dependency named with the phase it blocks | ✅ done |
| 0.4 | `LOG.md` — working session log (§26.8) | Claude Code | First session appended | ✅ done |
| 0.5 | `SECURITY.md` — STRIDE/LINDDUN baseline + secret hygiene (§17.1) | Security (G6) | Threat-model template + gitignore-for-secrets posture | ✅ done |
| 0.6 | Legal·Standards·Compliance matrix (`compliance/MATRIX.md`, §3) | Compliance (G7) | Every instrument → platform obligation → enforcement locus | ✅ done |
| 0.7 | `modules/CATALOGUE.md` — 391-module partition + `module.yaml` schema (§12) | PMU (G4) | Partition + schema + ≥2 real `module.yaml` examples | ✅ done |
| 0.8 | **Policy plane: real Rego/OPA bundles** (`policies/`, §8·§20) | Security (G6) | access (rbac/rebac/abac/pbac) + regulatory (rte/dpdp/rpwd/pocso/pfms_gfr) + OPA tests | ✅ done (authored; execution gated — see BLOCKERS) |
| 0.9 | CI templates scaffold (`.gitlab-ci/templates/*`, §22) | PMU (G4) | TS/security/compliance stage templates | ✅ done |
| 0.10 | Reference→Spec crosswalk (`docs/CC-SPEC-001-CROSSWALK.md`) | Chief Architect (G5) | Every reference module mapped to a spec layer/module + port verdict | ✅ done |
| 0.11 | `questions/QUESTION-0001` — the human-judgement fork (§26.10) | PMU (G4) | Context + choice-space + recommendation logged | ✅ done |

## What Phase 0 deliberately does NOT do
- No Kubernetes/Istio/Vault/ArgoCD, no datastores beyond the reference Postgres, no LLM serving, no Besu, no
  EMQX, no Keycloak/SpiceDB deployment, no 1-crore load run. All gated to Phases 1–8 and `BLOCKERS.md`.
- No deepening of the reference implementation (per the standing instruction).

## Exit / review gate (Cover Brief STEP 4)
Advance to Phase 1 only when: this plan is reviewed; ADRs accepted; `BLOCKERS.md` triaged and the listed
infrastructure commissioned; the compliance matrix signed by G6/G7; and the policy plane is executed in a CI
that has the OPA binary. **The build stops here pending that review.**

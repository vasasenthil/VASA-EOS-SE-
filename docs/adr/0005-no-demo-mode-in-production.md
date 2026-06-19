# ADR-0005 · No demo mode in the production system

- **Status:** Accepted
- **Date:** Phase 0
- **Deciders:** G6 Security & Compliance

## Context
CC-SPEC-001 §2.11 is explicit: "No demo mode. There is no test-data path that bypasses production controls,
no admin override that bypasses audit, no skip-auth flag." The reference implementation runs **in-memory by
default with a credential-free `demo_role` cookie** — directly contrary to §2.11.

## Decision
- The production build has **no demo mode, no in-memory fallback, no demo cookie**. Authentication is Keycloak
  (AAL2 default / AAL3 for governance & finance); persistence is the sovereign data fabric; every path is
  policy-gated and audited.
- The reference implementation's demo mode is quarantined to the reference app and is **explicitly excluded**
  from any production artefact. The crosswalk marks every demo-mode/in-memory code path as **DO-NOT-PORT**.
- CI for the production surfaces will fail the build if a `DEMO_MODE`, in-memory store, or auth-bypass symbol
  appears (a lint/Semgrep rule, authored in `.gitlab-ci/templates/security.yml`).

## Consequences
- The single most fundamental divergence between the reference impl and the spec is recorded and made
  enforceable, so it cannot silently leak into production.

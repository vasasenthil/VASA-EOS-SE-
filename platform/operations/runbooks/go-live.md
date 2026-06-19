# Runbook · Production go-live (Phase 8)

Driven by the `cutover` engine (ordered · idempotent · reversible). Each step has a precondition, an
idempotent action, a verify, and a rollback. On any failure the engine rolls back completed steps in reverse;
a re-run skips already-satisfied steps. Every transition is appended to the L5 audit chain.

## Preconditions (gate — `BLOCKERS.md`)
- [ ] TN State Data Centre (Chennai) + DR (Coimbatore) commissioned (B-001).
- [ ] HSM cluster online; Vault auto-unseal via PKCS#11; per-tenant KEKs provisioned (B-002).
- [ ] Off-switch quorum keys issued to T0 key-holders (B-002, ADR-0006).
- [ ] Kubernetes clusters + Istio + ArgoCD + SPIRE up; `tofu validate` green in CI (B-010, ADR-0007).
- [ ] Citus OLTP applied; RLS verified; polyglot stores provisioned (B-013, ADR-0009).
- [ ] Capacity model validated against the provisioned topology (ADR-0014); 1-crore rig run green (B-032).
- [ ] OPA policy plane deployed; all 6 PEPs enforcing; `opa test` green (ADR-0003/0008).

## Cutover steps (each: precondition → action → verify → rollback)
1. **freeze-writes** — quiesce the reference/staging system; verify no in-flight writes; rollback: unfreeze.
2. **final-sync** — replicate final data into Citus; verify row counts + audit-root parity; rollback: discard.
3. **dns-canary** — shift 1% traffic to the sovereign stack; verify SLOs hold (`slo`); rollback: revert DNS.
4. **ramp-traffic** — 1% → 25% → 100% with SLO gates between; verify each (`slo.DeployAllowed`); rollback: revert.
5. **enable-federation** — switch APAAR/UDISE+/PFMS adapters to live (B-022); verify conformance; rollback: mock.
6. **decommission-staging** — retire the staging surface; verify the sovereign stack is sole authority.

## Rollback / abort
Any failed step triggers automatic reverse rollback. A manual abort runs the same path. The **off-switch**
(M-of-N quorum, ADR-0006) is the last resort to disable the platform — it is NOT part of the routine runbook.

## Sign-off (Section 25 DoD)
G2 Platform Engineering + G6 Security & Compliance + G1 Sovereign Authority must co-sign before
`decommission-staging`. The audit chain is the record.

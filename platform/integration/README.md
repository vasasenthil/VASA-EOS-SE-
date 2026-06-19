# Integration · the composition root (every layer merged)

**CC-SPEC-001 · status: `platform-merged` (end-to-end, tested)**

This module is where the platform stops being 24 independent layer modules and becomes **one platform**. It
imports every layer and wires them into real, tested, end-to-end workflows — top-to-bottom and bottom-to-top.

## The `Platform` composition root
`New(cfg, decider, gate)` constructs and wires:

| Field | Layer | Module |
|---|---|---|
| `Switch` | L1 | off-switch (M-of-N sovereign disable) |
| `Limiter`, `Adm` | L10 | rate-limit + admission control |
| `KMS`, `Audit`, `PEP` | L5 | envelope KMS · immutable audit · policy enforcement |
| `Notary`, `Graph` | L7 | Merkle notary · knowledge graph |
| `Reg`, `Queue`, `Orchestrator` | L9 | agent registry · HITL queue · orchestrator |
| `Tutor` | L8 | inference gateway (guardrails + oracle) |
| `SLO`, `DR` | ops | error budget · DR controller |

`decider` (L5 PEP) and `gate` (L8 safety) are injected, so the platform runs against the **real Rego policy
plane** (CI / production) or deterministic fakes (unit tests) — the same wiring either way.

## Workflows (the merge, exercised)
- **`Admission` (top-to-bottom)** — an RTE application descends every layer:
  L10 rate-limit/admission → L1 off-switch → L3 residency → L5 KMS (seal PII) → L5 PEP (authorise) →
  L5 audit → L9 HITL (route EWS-quota reviews to a scoped human) → L7 (issue + anchor a verifiable credential).
- **`AskTutor` (bottom-to-top)** — a learner's question rises:
  L10 rate-limit → L8 serving (PII-redact · safety-gate · oracle) → L7 knowledge graph (readiness + learning
  path) → L5 audit.
- **`Advise`** — L8→L9 cognition→authority: an agent (composing the 6 engines) proposes a tool call; the
  orchestrator routes it auto-execute vs HITL by stakes/risk/confidence.
- **`ReconcileStudent`** — L4 federation: fetch APAAR through the resilient adapter, reconcile drift, audit.
- **`EvaluateModel`** — L8: PSI drift + disparate-impact gate deciding continued serving.
- **`GoLive`** — operations: an ordered, reversible cutover audited through the L5 chain.
- **`Readiness`** — merges L10 capacity + load model + operations DR + SLO + L1 into one go-live verdict.
- **`EscrowManifest` / `LoadScenarios`** — L1 source-escrow manifest; the §10.8 load suite.
- **`Disable` / `Enable`** — the sovereign off-switch as a platform API.

## Tests
- `integration_test.go` — every workflow end-to-end with deterministic fakes (12 cases): admission
  admit→credential, EWS→HITL→finalise, residency block, off-switch, rate-limit; tutor serve + injection
  refusal; federation drift; model gate; cutover; readiness (sufficient + undersized).
- `opa_integration_test.go` — the same composition wired to the **real OPA policy plane** (skips without the
  binary; runs in CI): admit permitted, EWS reject require-approval, tutor refuses injection.

Every cross-layer guarantee holds on the merged whole: the audit chain stays intact across a workflow, a
high-risk action always needs a scoped human, PII never leaves TN, and a disabled platform serves nothing.

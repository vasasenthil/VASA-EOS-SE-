# L2 · Infrastructure Substrate

**CC-SPEC-001 layer · Phase-1 status: `iac-authored` (apply substrate-gated)**

Kubernetes 1.30+ · Istio 1.22+ · OpenTelemetry · Vault · ArgoCD · SPIRE/SPIFFE · multi-region active-active.

| Component | Status | Notes |
|---|---|---|
| OpenTofu modules + per-site envs (`infra/`) — ADR-0007 | ✅ HCL authored | `tofu validate` in CI (B-023) |
| ArgoCD ApplicationSets (`argocd/`) — GitOps reconciliation | ✅ authored | applies when cluster exists |
| Observability values (`observability/loki-values.yaml`) — PII redaction | ✅ authored | |
| **Applying** any IaC (K8s/cloud substrate, Istio mTLS, Vault HSM unseal) | ⛔ substrate-gated | B-002 / B-010 / B-012 |

> The substrate is fully described as reviewable, versioned IaC (ADR-0007). **Applying** it requires the
> cluster substrate and TN-SDC; gated per `PHASE-1-PLAN.md` / Section 24 and `BLOCKERS.md`. Nothing is
> claimed live until its phase passes the Section 25 Definition of Done.

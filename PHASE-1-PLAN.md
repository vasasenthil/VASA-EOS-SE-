# PHASE-1-PLAN · Foundation (L1–L2) · CC-SPEC-001 §24

**Phase 1 · Days 3–14 · Revision: in-progress**

Phase 1 builds the Sovereign Foundation (L1) and Infrastructure Substrate (L2). Per §23, the **deliverables
are Infrastructure-as-Code** (OpenTofu modules + Helm/Kustomize + ArgoCD ApplicationSets) plus the **sovereign
foundation services** (`off-switch-svc`, `escrow-agent`). What is **authored + verified here** vs what
**requires the substrate** is split honestly below.

## Producible + verified in this environment
| # | Deliverable | Verification | Status |
|---|---|---|---|
| 1.1 | `off-switch-svc` (Go) — sovereign disable with **M-of-N key quorum** (§2.1, §4 L1) | `go test` (quorum, replay-safe, audit) | ✅ done |
| 1.2 | `escrow-agent` (Go) — source-code-escrow snapshot manifest + signature stub | `go test` | ✅ done |
| 1.3 | OpenTofu **modules** (`k8s-cluster`, `vault`, `istio`, `observability`, `argo-cd`, `cert-manager`) | `tofu fmt -check` / `tofu validate` | ✅ HCL authored; validated where the binary is available |
| 1.4 | OpenTofu **envs** (`prod-chennai`, `prod-coimbatore`, `staging`, `dev`) wiring the modules | `tofu fmt` | ✅ authored |
| 1.5 | ArgoCD **ApplicationSets** + Helm/Kustomize overlay scaffolds (L2 GitOps) | yaml structure | ✅ authored |
| 1.6 | Observability stack manifests (OTel · Prometheus · Grafana · Loki · Tempo) values | yaml structure | ✅ authored |
| 1.7 | ADR-0006 (off-switch design), ADR-0007 (IaC: OpenTofu + ArgoCD GitOps) | review | ✅ done |

## Requires the substrate (gated — `BLOCKERS.md`)
- **Applying** any IaC needs a Kubernetes/cloud substrate (B-010/B-012) and TN-SDC (B-001). No Docker daemon here.
- **Vault HSM auto-unseal** needs a real HSM (B-002); the module ships an auto-unseal **mock** seam per §24.
- **off-switch-svc** quorum keys are issued by the State HSM/PKI at deploy (B-002); the service logic is complete
  and tested with test keys.
- **step-ca / cert-manager** issuance, Istio mTLS, LitmusChaos GameDays — all run when the cluster exists.

## Exit / review gate
Phase 2 (Data Fabric & Security) begins only when: this plan is reviewed; the cluster substrate (B-010) and
TN-SDC (B-001) are commissioned; `tofu validate` passes against real providers in CI; and the off-switch-svc
quorum keys are issued by the State PKI. **The build stops at this gate after Phase 1's authorable deliverables.**

# ADR-0007 · Infrastructure-as-Code: OpenTofu modules + ArgoCD GitOps

- **Status:** Accepted
- **Date:** Phase 1
- **Deciders:** G2 Platform Engineering, G6 Security & Compliance

## Context
CC-SPEC-001 §23–§24 require the L2 Infrastructure Substrate to be expressed as **declarative
Infrastructure-as-Code** with a **GitOps** reconciliation loop — not hand-applied cloud consoles. Two
concerns shape the choice: **sovereignty** (the State must own and be able to run the tooling without a
vendor licence or a foreign control plane) and **auditability** (every infrastructure change reviewed,
versioned, and reconciled from Git).

The platform also targets **multi-site sovereign hosting** (TN State Data Centre, prod-chennai +
prod-coimbatore DR) rather than a single hyperscaler region, so the IaC must be provider-pluggable and the
environments must be cleanly separated.

## Decision
- **OpenTofu** (not Terraform) is the IaC engine — its MPL licence keeps the State free of the BSL terms on
  Terraform, consistent with sovereignty-by-construction (ADR-0004).
- Layout under `infra/`: reusable **modules** (`k8s-cluster`, `vault`, `istio`, `observability`, `argo-cd`,
  `cert-manager`) composed by per-site **envs** (`prod-chennai`, `prod-coimbatore`, `staging`, `dev`). Each
  env pins its own remote state backend (`backend.tf`).
- Security defaults are baked into the modules: `k8s-cluster` ships a **default-deny NetworkPolicy**; `vault`
  carries an HSM (PKCS#11) auto-unseal toggle (`use_hsm`) defaulting to a Shamir **mock** until the State HSM
  exists (B-002); `cert-manager`/Istio provide mTLS and issuance seams.
- **ArgoCD ApplicationSets** (`platform/L2-infrastructure/argocd/`) drive **GitOps** reconciliation: Git is
  the single source of truth; drift is corrected by the controller, not by humans. Observability values
  (`loki-values.yaml`) enforce **PII redaction** at ingestion.
- **Validation policy:** `tofu fmt -check` / `tofu validate` run in CI against real providers (B-023). In
  this authoring environment OpenTofu cannot be `go install`-ed (its `go.mod` uses replace directives) and no
  Docker/cloud substrate exists, so HCL is authored to valid syntax and validated where a binary is
  available; **applying** any module is gated on the cluster substrate (B-010/B-012) and TN-SDC (B-001).

## Consequences
- The substrate is fully described as reviewable, versioned code before any cluster exists, so commissioning
  is a `tofu apply` against the State Data Centre rather than a bespoke build.
- No vendor lock to Terraform BSL or to a single cloud; DR site (Coimbatore) is a sibling env, not a rewrite.
- Nothing here is *applied* — this ADR records the **authoring + GitOps contract**; the exit gate
  (PHASE-1-PLAN) holds until the substrate and State PKI/HSM are commissioned and `tofu validate` passes in
  CI against real providers.

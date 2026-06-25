# INFRA

**CC-SPEC-001 · Phase-1 status: `iac-authored` (apply substrate-gated)** · ADR-0007

OpenTofu modules + per-site envs for every environment (§23). No click-ops; GitOps reconciliation via ArgoCD
ApplicationSets; drift corrected by the controller.

```
infra/
  modules/   k8s-cluster (default-deny NetworkPolicy) · vault (HSM/Shamir toggle) · istio · observability · argo-cd · cert-manager
  envs/      prod-chennai (+backend) · prod-coimbatore (DR) · staging · dev
```

`tofu fmt -check` / `tofu validate` run in CI against real providers (B-023). **Applying** any module is gated
on the K8s/cloud substrate and TN-SDC (B-001 / B-010 / B-012); Vault HSM auto-unseal is gated on the State HSM
(B-002) and ships a Shamir mock seam until then.

# CC-SPEC-001 §24 Phase 1 — dev. Mirrors prod-chennai topology.
module "cluster" {
  source     = "../../modules/k8s-cluster"
  name       = "dev"
  region     = "dev"
  node_count = 6
}
module "cert_manager" {
  source = "../../modules/cert-manager"
}
module "istio" {
  source = "../../modules/istio"
}
module "vault" {
  source  = "../../modules/vault"
  use_hsm = false
}
module "observability" {
  source = "../../modules/observability"
}
module "argocd" {
  source = "../../modules/argo-cd"
}

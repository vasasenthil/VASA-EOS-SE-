# CC-SPEC-001 §24 Phase 1 — primary region (TN-SDC Chennai). Active-active with Coimbatore.
terraform {
  required_version = ">= 1.7"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.30"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13"
    }
  }
}
provider "kubernetes" {
  config_path = "~/.kube/config-chennai"
}
provider "helm" {
  kubernetes {
    config_path = "~/.kube/config-chennai"
  }
}
module "cluster" {
  source     = "../../modules/k8s-cluster"
  name       = "prod-chennai"
  region     = "chennai"
  node_count = 200
}
module "cert_manager" {
  source = "../../modules/cert-manager"
}
module "istio" {
  source = "../../modules/istio"
}
module "vault" {
  source  = "../../modules/vault"
  use_hsm = false # B-002 → true at deploy
}
module "observability" {
  source = "../../modules/observability"
}
module "argocd" {
  source = "../../modules/argo-cd"
}

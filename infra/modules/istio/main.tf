# Istio 1.22+ ambient mesh (ztunnel + waypoints) for mTLS + L7 authz (§9.6, §17.2).
terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13"
    }
  }
}
resource "helm_release" "istio_base" {
  name             = "istio-base"
  namespace        = "istio-system"
  create_namespace = true
  repository       = "https://istio-release.storage.googleapis.com/charts"
  chart            = "base"
}
resource "helm_release" "istiod" {
  name       = "istiod"
  namespace  = "istio-system"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  depends_on = [helm_release.istio_base]
}

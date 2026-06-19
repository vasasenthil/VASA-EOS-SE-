# cert-manager + step-ca internal PKI; CCA-certified CA for citizen-facing signatures (§9.5).
terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13"
    }
  }
}
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  set {
    name  = "installCRDs"
    value = "true"
  }
}

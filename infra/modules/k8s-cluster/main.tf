# Sovereign Kubernetes cluster (1.30+) on TN-SDC bare metal (§4 L2, §9.10).
# Provider-agnostic skeleton: the concrete provider (cluster-api / kubeadm / sovereign cloud) is wired
# per env. This module asserts the hardened defaults the spec mandates and is APPLIED only against a
# real substrate (BLOCKERS B-010/B-001).
terraform {
  required_version = ">= 1.7"
  required_providers {
    kubernetes = { source = "hashicorp/kubernetes", version = ">= 2.30" }
    helm       = { source = "hashicorp/helm", version = ">= 2.13" }
  }
}

resource "kubernetes_namespace" "platform" {
  metadata {
    name = "vasa-platform"
    labels = {
      "pod-security.kubernetes.io/enforce" = var.pod_security
      "tn.sovereign/region"                = var.region
    }
  }
}

# NetworkPolicy deny-by-default for the platform namespace (§17.2).
resource "kubernetes_network_policy" "default_deny" {
  metadata {
    name      = "default-deny"
    namespace = kubernetes_namespace.platform.metadata[0].name
  }
  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]
  }
}

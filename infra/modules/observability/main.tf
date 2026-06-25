terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13"
    }
  }
}
variable "namespace" {
  type    = string
  default = "observability"
}
locals {
  charts = {
    "kube-prometheus-stack"   = "https://prometheus-community.github.io/helm-charts"
    "loki"                    = "https://grafana.github.io/helm-charts"
    "tempo"                   = "https://grafana.github.io/helm-charts"
    "opentelemetry-collector" = "https://open-telemetry.github.io/opentelemetry-helm-charts"
  }
}
resource "helm_release" "obs" {
  for_each         = local.charts
  name             = each.key
  namespace        = var.namespace
  create_namespace = true
  repository       = each.value
  chart            = each.key
}

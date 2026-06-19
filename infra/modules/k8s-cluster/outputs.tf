output "namespace" { value = kubernetes_namespace.platform.metadata[0].name }
output "region"    { value = var.region }

terraform { required_providers { helm = { source = "hashicorp/helm", version = ">= 2.13" } } }
resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
}

# HashiCorp Vault with HSM (PKCS#11) auto-unseal (§9.5, §17.4). Until the State HSM exists (BLOCKERS
# B-002), use_hsm=false selects a Shamir mock seam so the substrate stands up; production sets it true.
terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.13"
    }
  }
}
variable "use_hsm" {
  type    = bool
  default = false
}
variable "namespace" {
  type    = string
  default = "vault"
}
resource "helm_release" "vault" {
  name             = "vault"
  namespace        = var.namespace
  create_namespace = true
  repository       = "https://helm.releases.hashicorp.com"
  chart            = "vault"
  values = [yamlencode({
    server = {
      ha = { enabled = true, replicas = 5 }
      seal = var.use_hsm ? {
        pkcs11 = { lib = "/usr/lib/softhsm/libsofthsm2.so", key_label = "vault-unseal", mechanism = "0x1085" }
        } : {
        shamir = {} # MOCK until HSM (B-002)
      }
    }
  })]
}

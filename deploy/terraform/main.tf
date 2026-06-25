# VASA-EOS(SE) TN — Terraform skeleton for a sovereign deployment.
# Provider-agnostic shape: a managed Postgres, a container app/cluster, secrets,
# and an object store for immutable backups. Fill provider blocks for the target
# (TN State Data Centre / MeitY MeghRaj / chosen sovereign cloud) before apply.

terraform {
  required_version = ">= 1.6"
  # backend "s3" { ... }   # state in the sovereign object store
}

variable "environment" {
  type    = string
  default = "production"
}

variable "image_tag" {
  type    = string
  default = "1.0.0"
}

# ── Data store: managed Postgres (durable persistence + RLS) ─────────────────
# resource "<provider>_postgres" "vasa" {
#   name              = "vasa-eos-${var.environment}"
#   engine_version    = "16"
#   high_availability = true
#   backup_retention  = 35   # days — aligns with lib/ops-posture backup cadence
# }

# ── Compute: container app / k8s namespace running the image from Dockerfile ──
# resource "<provider>_container_app" "vasa" {
#   image    = "registry.tn.gov.in/vasa-eos-se:${var.image_tag}"
#   replicas = 3
#   env      = { NODE_ENV = "production" }
#   secrets  = [<provider>_secret.vasa.id]
# }

# ── Secrets: integration keys + DB service-role key (no plaintext in code) ────
# resource "<provider>_secret" "vasa" {
#   name = "vasa-eos-secrets"
#   # SUPABASE_SERVICE_ROLE_KEY, INTEGRATION_*, *_API_KEY, OTEL_EXPORTER_OTLP_ENDPOINT
# }

# ── Backups: immutable object store (ransomware-resilient, per DR posture) ────
# resource "<provider>_object_store" "backups" {
#   name           = "vasa-eos-backups"
#   object_locking = true
# }

output "next_steps" {
  value = "Fill provider blocks for the TN SDC target, set the Secret values, then `terraform apply`."
}

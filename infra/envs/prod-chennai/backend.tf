# State in the TN sovereign object store (MinIO, S3-compatible) — never a vendor cloud (§2.1, §23).
terraform {
  backend "s3" {
    bucket                      = "vasa-tofu-state"
    key                         = "prod-chennai/terraform.tfstate"
    endpoints                   = { s3 = "https://minio.tn-sdc.gov.in" }
    region                      = "tn-sdc-chennai"
    skip_credentials_validation = true
    skip_region_validation      = true
    use_path_style              = true
  }
}

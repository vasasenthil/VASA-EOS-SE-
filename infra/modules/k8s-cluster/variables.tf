variable "name" { type = string }
variable "region" { type = string } # chennai | coimbatore
variable "node_count" {
  type    = number
  default = 200 # min at full scale (§10.3)
}
variable "control_plane_ha" {
  type    = bool
  default = true
}
variable "pod_security" {
  type    = string
  default = "restricted" # CIS / PSS (§17.2)
}

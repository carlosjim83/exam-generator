variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "container_app_environment_id" { type = string }
variable "container_image" { type = string }
variable "target_port" { type = number }
variable "cpu" {
  type    = number
  default = 0.5
}
variable "memory" {
  type    = string
  default = "1Gi"
}
variable "min_replicas" {
  type    = number
  default = 1
}
variable "max_replicas" {
  type    = number
  default = 10
}
variable "registry_server" { type = string }
variable "registry_username" { type = string }
variable "registry_password" {
  type      = string
  sensitive = true
}
variable "env_vars" {
  type = list(object({
    name   = string
    value  = string
    secret = optional(bool, false)
  }))
  default = []
}
variable "external_ingress_enabled" {
  type    = bool
  default = true
}
variable "tags" {
  type    = map(string)
  default = {}
}

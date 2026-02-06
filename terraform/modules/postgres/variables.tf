variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "administrator_login" {
  type      = string
  sensitive = true
}
variable "administrator_password" {
  type      = string
  sensitive = true
}
variable "postgres_version" {
  type    = string
  default = "16"
}
variable "sku_name" {
  type    = string
  default = "Standard_B1ms"
}
variable "storage_mb" {
  type    = number
  default = 32768
}
variable "backup_retention_days" {
  type    = number
  default = 7
}
variable "geo_redundant_backup" {
  type    = bool
  default = false
}
variable "database_name" { type = string }
variable "tags" {
  type    = map(string)
  default = {}
}

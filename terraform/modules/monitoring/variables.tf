variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "application_type" {
  type    = string
  default = "web"
}
variable "workspace_id" {
  type    = string
  default = null
}
variable "tags" {
  type    = map(string)
  default = {}
}

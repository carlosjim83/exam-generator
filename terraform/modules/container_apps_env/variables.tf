variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "instrumentation_key" {
  type    = string
  default = ""
}
variable "tags" {
  type    = map(string)
  default = {}
}

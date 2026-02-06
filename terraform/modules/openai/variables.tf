variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "kind" {
  type    = string
  default = "OpenAI"
}
variable "sku_name" {
  type    = string
  default = "S0"
}
variable "deployments" {
  type = list(object({
    name = string
    model = object({
      format  = string
      name    = string
      version = string
    })
    sku = object({
      name     = string
      capacity = number
    })
  }))
  default = []
}
variable "tags" {
  type    = map(string)
  default = {}
}

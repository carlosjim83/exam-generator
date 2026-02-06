# ================================
# Azure Cache for Redis Module - Variables
# ================================

variable "name" {
  type        = string
  description = "Name of the Redis cache"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "sku_name" {
  type        = string
  description = "SKU name: Basic, Standard, or Premium"
  default     = "Basic"
}

variable "family" {
  type        = string
  description = "SKU family: C (Basic/Standard) or P (Premium)"
  default     = "C"
}

variable "capacity" {
  type        = number
  description = "Cache size: 0-6 for C family, 1-5 for P family"
  default     = 0
}

variable "minimum_tls_version" {
  type        = string
  description = "Minimum TLS version"
  default     = "1.2"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}

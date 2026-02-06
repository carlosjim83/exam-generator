# ================================
# Azure Cache for Redis Module
# ================================
# This module provisions Azure Cache for Redis (classic).
#
# NOTE: Azure Cache for Redis is retiring on September 30, 2028.
# This configuration maintains the current setup until migration is needed.
#
# Current Setup:
# - Basic C0 tier (250MB)
# - Single node (no HA)
# - TLS on port 6380
# - Used for BullMQ job queues

resource "azurerm_redis_cache" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location

  # SKU Configuration
  # Family: C (Basic/Standard) or P (Premium)
  # Capacity: 0-6 for C family, 1-5 for P family
  family   = var.family
  sku_name = var.sku_name
  capacity = var.capacity

  # Network & Security
  minimum_tls_version = var.minimum_tls_version
  
  # Redis Configuration
  enable_non_ssl_port = false  # Always use TLS

  # Optional: Redis configuration settings
  redis_configuration {
    enable_authentication = true
  }

  tags = var.tags
}

# ================================
# Outputs
# ================================

output "id" {
  description = "ID of the Redis Cache"
  value       = azurerm_redis_cache.main.id
}

output "hostname" {
  description = "Hostname of the Redis instance"
  value       = azurerm_redis_cache.main.hostname
}

output "ssl_port" {
  description = "SSL port for Redis (6380)"
  value       = azurerm_redis_cache.main.ssl_port
}

output "port" {
  description = "Non-SSL port for Redis (disabled by default)"
  value       = azurerm_redis_cache.main.port
}

output "primary_access_key" {
  description = "Primary access key for Redis"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "secondary_access_key" {
  description = "Secondary access key for Redis"
  value       = azurerm_redis_cache.main.secondary_access_key
  sensitive   = true
}

output "connection_string" {
  description = "Connection string for Redis (TLS)"
  value       = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True,abortConnect=False"
  sensitive   = true
}

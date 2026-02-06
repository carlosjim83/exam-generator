# ================================
# Exam Generator - Outputs
# ================================

# ================================
# Resource Group
# ================================

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# ================================
# Container Registry
# ================================

output "acr_login_server" {
  description = "Login server URL for Azure Container Registry"
  value       = module.acr.login_server
}

output "acr_admin_username" {
  description = "Admin username for ACR"
  value       = module.acr.admin_username
  sensitive   = true
}

# ================================
# Storage Account
# ================================

output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "storage_primary_connection_string" {
  description = "Primary connection string for storage account"
  value       = module.storage.primary_connection_string
  sensitive   = true
}

# ================================
# PostgreSQL
# ================================

output "postgres_fqdn" {
  description = "Fully qualified domain name of PostgreSQL server"
  value       = module.postgres.fqdn
}

output "postgres_connection_string" {
  description = "Connection string for PostgreSQL"
  value       = module.postgres.connection_string
  sensitive   = true
}

# ================================
# Azure Managed Redis
# ================================

output "redis_hostname" {
  description = "Hostname of Azure Managed Redis instance"
  value       = module.redis.hostname
}

output "redis_ssl_port" {
  description = "SSL port for Azure Managed Redis"
  value       = module.redis.ssl_port
}

output "redis_primary_access_key" {
  description = "Primary access key for Azure Managed Redis"
  value       = module.redis.primary_access_key
  sensitive   = true
}

output "redis_connection_string" {
  description = "Connection string for Azure Managed Redis"
  value       = module.redis.connection_string
  sensitive   = true
}

# ================================
# Azure OpenAI
# ================================

output "openai_endpoint" {
  description = "Endpoint URL for Azure OpenAI"
  value       = module.openai.endpoint
}

output "openai_primary_key" {
  description = "Primary access key for Azure OpenAI"
  value       = module.openai.primary_access_key
  sensitive   = true
}

# ================================
# Application Insights
# ================================

output "app_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = module.app_insights.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = module.app_insights.connection_string
  sensitive   = true
}

# ================================
# Container Apps
# ================================

output "container_apps_environment_default_domain" {
  description = "Default domain for Container Apps Environment"
  value       = module.container_apps_env.default_domain
}

output "backend_app_fqdn" {
  description = "FQDN of the backend container app"
  value       = module.backend_app.fqdn
}

output "frontend_app_fqdn" {
  description = "FQDN of the frontend container app"
  value       = module.frontend_app.fqdn
}

output "backend_app_url" {
  description = "Full URL of the backend application"
  value       = "https://${module.backend_app.fqdn}"
}

output "frontend_app_url" {
  description = "Full URL of the frontend application"
  value       = "https://${module.frontend_app.fqdn}"
}

# ================================
# Quick Access URLs
# ================================

output "application_urls" {
  description = "Quick access URLs for the application"
  value = {
    frontend = "https://${module.frontend_app.fqdn}"
    backend  = "https://${module.backend_app.fqdn}"
    health   = "https://${module.backend_app.fqdn}/health"
  }
}

# ================================
# Cost Estimation (Approximations)
# ================================

output "estimated_monthly_costs" {
  description = "Estimated monthly costs in USD (approximate)"
  value = {
    acr                  = "~$5 (Basic)"
    storage              = "~$1-2"
    postgres             = "~$15 (Standard_B1ms)"
    redis                = var.redis_non_ha ? "~$12-15 (B0 non-HA)" : "~$25-30 (B0 HA)"
    openai               = "Pay-per-use"
    container_apps       = "~$5-10 (depends on usage)"
    app_insights         = "~$5"
    total_excluding_openai = var.redis_non_ha ? "~$43-47/month" : "~$56-62/month"
  }
}

# ================================
# Exam Generator - Main Terraform Configuration
# ================================
# This file orchestrates all infrastructure resources for the Exam Generator application.
# It uses modules to organize resources logically and maintains state in Azure Storage.
#
# Architecture:
# - Azure Container Apps for backend/frontend
# - Azure Managed Redis (replacing Azure Cache for Redis)
# - PostgreSQL Flexible Server
# - Azure Storage (blob storage)
# - Azure Container Registry
# - Azure OpenAI
# - Key Vault for secrets
# - Application Insights for monitoring

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  # TODO: Enable remote state once you have a storage account for Terraform state
  # backend "azurerm" {
  #   resource_group_name  = "exam-generator-tfstate-rg"
  #   storage_account_name = "examgentfstate"
  #   container_name       = "tfstate"
  #   key                  = "production.terraform.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  subscription_id = var.subscription_id
}

# ================================
# Data Sources
# ================================

data "azurerm_client_config" "current" {}

# ================================
# Resource Group
# ================================

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = var.common_tags
}

# ================================
# Key Vault Module
# ================================
# NOTE: Commented out due to soft-delete purge issue
# Uncomment when needed for production secrets management
# module "keyvault" {
#   source = "./modules/keyvault"
#
#   name                = var.keyvault_name
#   resource_group_name = azurerm_resource_group.main.name
#   location            = azurerm_resource_group.main.location
#   tenant_id           = data.azurerm_client_config.current.tenant_id
#   object_id           = data.azurerm_client_config.current.object_id
#
#   tags = var.common_tags
# }

# ================================
# Container Registry Module
# ================================

module "acr" {
  source = "./modules/acr"

  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku

  tags = var.common_tags
}

# ================================
# Storage Account Module
# ================================

module "storage" {
  source = "./modules/storage"

  name                = var.storage_account_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  account_tier        = "Standard"
  replication_type    = "LRS"

  containers = ["documents"]

  tags = var.common_tags
}

# ================================
# PostgreSQL Flexible Server Module
# ================================

module "postgres" {
  source = "./modules/postgres"

  name                = var.postgres_server_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  administrator_login    = var.postgres_admin_username
  administrator_password = var.postgres_admin_password

  sku_name        = var.postgres_sku
  postgres_version = "16"
  storage_mb      = 32768

  backup_retention_days = 7
  geo_redundant_backup  = false

  database_name = var.postgres_database_name

  tags = var.common_tags
}

# ================================
# Azure Managed Redis Module
# ================================
# This replaces Azure Cache for Redis with the new Azure Managed Redis
# Benefits:
# - Lower cost (especially with B0 tier for dev)
# - Better performance
# - Redis 7.2+ with modern modules
# - Up to 99.999% availability

module "redis" {
  source = "./modules/redis"

  name                = var.redis_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  # Azure Cache for Redis configuration
  # Basic C0 = 250MB, Basic C1 = 1GB, etc.
  sku_name = "Basic"
  family   = "C"
  capacity = 0  # C0 = 250MB

  minimum_tls_version = "1.2"

  tags = var.common_tags
}

# ================================
# Azure OpenAI Service Module
# ================================

module "openai" {
  source = "./modules/openai"

  name                = var.openai_account_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  sku_name = "S0"
  kind     = "OpenAI"

  deployments = [
    {
      name  = "gpt-4o"
      model = {
        format  = "OpenAI"
        name    = "gpt-4o"
        version = "2024-08-06"
      }
      sku = {
        name     = "Standard"
        capacity = 10
      }
    },
    {
      name  = "text-embedding-3-small"
      model = {
        format  = "OpenAI"
        name    = "text-embedding-3-small"
        version = "1"
      }
      sku = {
        name     = "GlobalStandard"
        capacity = 10
      }
    }
  ]

  tags = var.common_tags
}

# ================================
# Application Insights Module
# ================================

module "app_insights" {
  source = "./modules/monitoring"

  name                = var.app_insights_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  application_type = "web"
  workspace_id     = "/subscriptions/3dd664e4-ed58-463c-8afc-ccc2cd460b5f/resourceGroups/ai_exam-generator-insights_b7f5cdfe-eb2c-4133-b376-239151044106_managed/providers/Microsoft.OperationalInsights/workspaces/managed-exam-generator-insights-ws"

  tags = var.common_tags
}

# ================================
# Container Apps Environment Module
# ================================

module "container_apps_env" {
  source = "./modules/container_apps_env"

  name                = var.container_apps_env_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  instrumentation_key = module.app_insights.instrumentation_key

  tags = var.common_tags
}

# ================================
# Backend Container App Module
# ================================

module "backend_app" {
  source = "./modules/container_app"

  name                         = var.backend_app_name
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  container_app_environment_id = module.container_apps_env.id

  container_image  = "${module.acr.login_server}/exam-generator-backend:latest"
  target_port      = 3001
  cpu              = 0.5
  memory           = "1Gi"
  min_replicas     = 1
  max_replicas     = 10

  registry_server   = module.acr.login_server
  registry_username = module.acr.admin_username
  registry_password = module.acr.admin_password

  env_vars = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "3001" },
    { name = "DATABASE_URL", value = module.postgres.connection_string },
    { name = "REDIS_HOST", value = module.redis.hostname },
    { name = "REDIS_PORT", value = tostring(module.redis.ssl_port) },
    { name = "REDIS_PASSWORD", value = module.redis.primary_access_key, secret = true },
    { name = "AZURE_STORAGE_ACCOUNT_NAME", value = module.storage.storage_account_name },
    { name = "AZURE_STORAGE_ACCOUNT_KEY", value = module.storage.primary_access_key, secret = true },
    { name = "AZURE_STORAGE_CONNECTION_STRING", value = module.storage.primary_connection_string, secret = true },
    { name = "AZURE_OPENAI_API_KEY", value = module.openai.primary_access_key, secret = true },
    { name = "AZURE_OPENAI_ENDPOINT", value = module.openai.endpoint },
    { name = "AZURE_OPENAI_EMBEDDING_DEPLOYMENT", value = "text-embedding-3-small" },
    { name = "AZURE_OPENAI_CHAT_DEPLOYMENT", value = "gpt-4o" },
    { name = "AZURE_OPENAI_API_VERSION", value = "2024-08-01-preview" },
    { name = "JWT_SECRET", value = var.jwt_secret, secret = true },
    { name = "JWT_REFRESH_SECRET", value = var.jwt_refresh_secret, secret = true },
    { name = "FRONTEND_URL", value = "https://${var.frontend_app_name}.${module.container_apps_env.default_domain}" },
    { name = "GOOGLE_CLIENT_ID", value = var.google_client_id },
    { name = "GOOGLE_CLIENT_SECRET", value = var.google_client_secret, secret = true },
    { name = "GOOGLE_CALLBACK_URL", value = "https://${var.backend_app_name}.${module.container_apps_env.default_domain}/auth/google/callback" },
    { name = "ENABLE_OAUTH_MOCK", value = "false" },
  ]

  external_ingress_enabled = true

  tags = var.common_tags

  depends_on = [
    module.postgres,
    module.redis,
    module.storage,
    module.openai
  ]
}

# ================================
# Frontend Container App Module
# ================================

module "frontend_app" {
  source = "./modules/container_app"

  name                         = var.frontend_app_name
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  container_app_environment_id = module.container_apps_env.id

  container_image  = "${module.acr.login_server}/exam-generator-frontend:latest"
  target_port      = 3000
  cpu              = 0.25
  memory           = "0.5Gi"
  min_replicas     = 1
  max_replicas     = 5

  registry_server   = module.acr.login_server
  registry_username = module.acr.admin_username
  registry_password = module.acr.admin_password

  env_vars = [
    { name = "NEXT_PUBLIC_API_URL", value = "https://${var.backend_app_name}.${module.container_apps_env.default_domain}" },
  ]

  external_ingress_enabled = true

  tags = var.common_tags

  depends_on = [module.backend_app]
}

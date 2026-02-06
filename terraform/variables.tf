# ================================
# Exam Generator - Variables
# ================================

# ================================
# Azure Subscription
# ================================

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

# ================================
# Resource Group
# ================================


variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "exam-generator-rg-v2"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "swedencentral"
}

# ================================
# Common Tags
# ================================

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ExamGenerator"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# ================================
# Key Vault
# ================================

variable "keyvault_name" {
  description = "Name of the Key Vault"
  type        = string
  default     = "exam-gen-kv-cj"
}

# ================================
# Container Registry
# ================================

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "examgeneratorcj"
}

variable "acr_sku" {
  description = "SKU tier for Azure Container Registry"
  type        = string
  default     = "Basic"
  
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

# ================================
# Storage Account
# ================================

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
  default     = "examgenstoragecj"
}

# ================================
# PostgreSQL
# ================================

variable "postgres_server_name" {
  description = "Name of the PostgreSQL server"
  type        = string
  default     = "exam-generator-db"
}

variable "postgres_admin_username" {
  description = "Administrator username for PostgreSQL"
  type        = string
  default     = "examgenadmin"
  sensitive   = true
}

variable "postgres_admin_password" {
  description = "Administrator password for PostgreSQL"
  type        = string
  sensitive   = true
}

variable "postgres_database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "exam_generator"
}

variable "postgres_sku" {
  description = "SKU for PostgreSQL Flexible Server (must include tier prefix: B_, GP_, MO_)"
  type        = string
  default     = "B_Standard_B1ms"
}

# ================================
# Azure Managed Redis
# ================================
# Azure Managed Redis replaces Azure Cache for Redis
# Pricing tiers:
# - B0 (1GB) - Balanced, cheapest, good for dev/test
# - B1 (1GB) - Balanced, slightly better performance
# - M10 (12GB) - Memory Optimized
# - X3 (3GB) - Compute Optimized

variable "redis_name" {
  description = "Name of the Azure Managed Redis instance"
  type        = string
  default     = "exam-generator-redis"
}

variable "redis_sku_name" {
  description = "SKU for Azure Managed Redis (e.g., B0, B1, M10, X3)"
  type        = string
  default     = "B0"  # 1GB Balanced tier - cheapest option
}

variable "redis_capacity_gb" {
  description = "Memory capacity in GB for Azure Managed Redis"
  type        = number
  default     = 1  # 1GB for B0/B1 tiers
}

variable "redis_non_ha" {
  description = "Set to true for non-HA (single node) configuration to save costs in dev/test"
  type        = bool
  default     = false  # Set to true for dev to save money
}

# ================================
# Azure OpenAI
# ================================

variable "openai_account_name" {
  description = "Name of the Azure OpenAI account"
  type        = string
  default     = "examgen-openai-cj-9351"
}

# ================================
# Application Insights
# ================================

variable "app_insights_name" {
  description = "Name of Application Insights"
  type        = string
  default     = "exam-generator-insights"
}

# ================================
# Container Apps Environment
# ================================

variable "container_apps_env_name" {
  description = "Name of the Container Apps Environment"
  type        = string
  default     = "exam-generator-env"
}

# ================================
# Backend Container App
# ================================

variable "backend_app_name" {
  description = "Name of the backend container app"
  type        = string
  default     = "exam-generator-backend"
}

# ================================
# Frontend Container App
# ================================

variable "frontend_app_name" {
  description = "Name of the frontend container app"
  type        = string
  default     = "exam-generator-frontend"
}

# ================================
# Application Secrets
# ================================

variable "jwt_secret" {
  description = "Secret key for JWT tokens"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "Secret key for JWT refresh tokens"
  type        = string
  sensitive   = true
}

# ================================
# OAuth Configuration
# ================================

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

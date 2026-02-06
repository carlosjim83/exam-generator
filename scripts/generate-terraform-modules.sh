#!/bin/bash
# ================================
# Generate Terraform Module Stubs
# ================================
# This script generates basic Terraform modules for the remaining resources.
# You'll need to customize them based on your exact requirements.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"
MODULES_DIR="$TERRAFORM_DIR/modules"

echo "🏗️  Generating Terraform module stubs..."

# ================================
# PostgreSQL Module
# ================================
cat > "$MODULES_DIR/postgres/main.tf" <<'EOF'
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = var.name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = var.version
  administrator_login    = var.administrator_login
  administrator_password = var.administrator_password
  storage_mb             = var.storage_mb
  sku_name               = var.sku_name

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup

  tags = var.tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

output "id" {
  value = azurerm_postgresql_flexible_server.main.id
}

output "fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "connection_string" {
  value     = "postgresql://${var.administrator_login}:${var.administrator_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.database_name}?sslmode=require"
  sensitive = true
}
EOF

cat > "$MODULES_DIR/postgres/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "administrator_login" { type = string; sensitive = true }
variable "administrator_password" { type = string; sensitive = true }
variable "version" { type = string; default = "16" }
variable "sku_name" { type = string; default = "Standard_B1ms" }
variable "storage_mb" { type = number; default = 32768 }
variable "backup_retention_days" { type = number; default = 7 }
variable "geo_redundant_backup" { type = bool; default = false }
variable "database_name" { type = string }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ PostgreSQL module created"

# ================================
# Storage Module
# ================================
cat > "$MODULES_DIR/storage/main.tf" <<'EOF'
resource "azurerm_storage_account" "main" {
  name                     = var.name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = var.account_tier
  account_replication_type = var.replication_type
  min_tls_version          = "TLS1_2"
  allow_nested_items_to_be_public = false

  tags = var.tags
}

resource "azurerm_storage_container" "containers" {
  for_each              = toset(var.containers)
  name                  = each.value
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "primary_access_key" {
  value     = azurerm_storage_account.main.primary_access_key
  sensitive = true
}

output "primary_connection_string" {
  value     = azurerm_storage_account.main.primary_connection_string
  sensitive = true
}
EOF

cat > "$MODULES_DIR/storage/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "account_tier" { type = string; default = "Standard" }
variable "replication_type" { type = string; default = "LRS" }
variable "containers" { type = list(string); default = [] }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ Storage module created"

# ================================
# ACR Module
# ================================
cat > "$MODULES_DIR/acr/main.tf" <<'EOF'
resource "azurerm_container_registry" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = true

  tags = var.tags
}

output "id" {
  value = azurerm_container_registry.main.id
}

output "login_server" {
  value = azurerm_container_registry.main.login_server
}

output "admin_username" {
  value     = azurerm_container_registry.main.admin_username
  sensitive = true
}

output "admin_password" {
  value     = azurerm_container_registry.main.admin_password
  sensitive = true
}
EOF

cat > "$MODULES_DIR/acr/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "sku" { type = string; default = "Basic" }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ ACR module created"

# ================================
# Key Vault Module
# ================================
cat > "$MODULES_DIR/keyvault/main.tf" <<'EOF'
resource "azurerm_key_vault" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  tenant_id           = var.tenant_id
  sku_name            = "standard"
  
  soft_delete_retention_days = 90
  purge_protection_enabled   = false

  access_policy {
    tenant_id = var.tenant_id
    object_id = var.object_id

    secret_permissions = ["Get", "List", "Set", "Delete", "Recover", "Backup", "Restore", "Purge"]
    key_permissions    = ["Get", "List", "Create", "Delete", "Recover", "Backup", "Restore", "Purge"]
  }

  tags = var.tags
}

output "id" {
  value = azurerm_key_vault.main.id
}

output "vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}
EOF

cat > "$MODULES_DIR/keyvault/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tenant_id" { type = string }
variable "object_id" { type = string }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ Key Vault module created"

# ================================
# Azure OpenAI Module
# ================================
cat > "$MODULES_DIR/openai/main.tf" <<'EOF'
resource "azurerm_cognitive_account" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  kind                = var.kind
  sku_name            = var.sku_name

  tags = var.tags
}

resource "azurerm_cognitive_deployment" "deployments" {
  for_each = { for d in var.deployments : d.name => d }

  name                 = each.value.name
  cognitive_account_id = azurerm_cognitive_account.main.id

  model {
    format  = each.value.model.format
    name    = each.value.model.name
    version = each.value.model.version
  }

  sku {
    name     = each.value.sku.name
    capacity = each.value.sku.capacity
  }
}

output "id" {
  value = azurerm_cognitive_account.main.id
}

output "endpoint" {
  value = azurerm_cognitive_account.main.endpoint
}

output "primary_access_key" {
  value     = azurerm_cognitive_account.main.primary_access_key
  sensitive = true
}
EOF

cat > "$MODULES_DIR/openai/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "kind" { type = string; default = "AIServices" }
variable "sku_name" { type = string; default = "S0" }
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
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ Azure OpenAI module created"

# ================================
# Monitoring Module
# ================================
cat > "$MODULES_DIR/monitoring/main.tf" <<'EOF'
resource "azurerm_application_insights" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  application_type    = var.application_type

  tags = var.tags
}

output "id" {
  value = azurerm_application_insights.main.id
}

output "instrumentation_key" {
  value     = azurerm_application_insights.main.instrumentation_key
  sensitive = true
}

output "connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}
EOF

cat > "$MODULES_DIR/monitoring/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "application_type" { type = string; default = "web" }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ Monitoring module created"

# ================================
# Container Apps Environment Module
# ================================
cat > "$MODULES_DIR/container_apps_env/main.tf" <<'EOF'
resource "azurerm_container_app_environment" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = var.tags
}

output "id" {
  value = azurerm_container_app_environment.main.id
}

output "default_domain" {
  value = azurerm_container_app_environment.main.default_domain
}
EOF

cat > "$MODULES_DIR/container_apps_env/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "instrumentation_key" { type = string; default = "" }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ Container Apps Environment module created"

# ================================
# Container App Module
# ================================
cat > "$MODULES_DIR/container_app/main.tf" <<'EOF'
resource "azurerm_container_app" "main" {
  name                         = var.name
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.container_app_environment_id
  revision_mode                = "Single"

  template {
    container {
      name   = var.name
      image  = var.container_image
      cpu    = var.cpu
      memory = var.memory
      
      dynamic "env" {
        for_each = var.env_vars
        content {
          name        = env.value.name
          value       = lookup(env.value, "secret", false) ? null : env.value.value
          secret_name = lookup(env.value, "secret", false) ? env.value.name : null
        }
      }
    }

    min_replicas = var.min_replicas
    max_replicas = var.max_replicas
  }

  ingress {
    external_enabled = var.external_ingress_enabled
    target_port      = var.target_port

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  registry {
    server               = var.registry_server
    username             = var.registry_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = var.registry_password
  }

  dynamic "secret" {
    for_each = [for env in var.env_vars : env if lookup(env, "secret", false)]
    content {
      name  = secret.value.name
      value = secret.value.value
    }
  }

  tags = var.tags
}

output "fqdn" {
  value = azurerm_container_app.main.ingress[0].fqdn
}

output "id" {
  value = azurerm_container_app.main.id
}
EOF

cat > "$MODULES_DIR/container_app/variables.tf" <<'EOF'
variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "container_app_environment_id" { type = string }
variable "container_image" { type = string }
variable "target_port" { type = number }
variable "cpu" { type = number; default = 0.5 }
variable "memory" { type = string; default = "1Gi" }
variable "min_replicas" { type = number; default = 1 }
variable "max_replicas" { type = number; default = 10 }
variable "registry_server" { type = string }
variable "registry_username" { type = string }
variable "registry_password" { type = string; sensitive = true }
variable "env_vars" {
  type = list(object({
    name   = string
    value  = string
    secret = optional(bool, false)
  }))
  default = []
}
variable "external_ingress_enabled" { type = bool; default = true }
variable "tags" { type = map(string); default = {} }
EOF

echo "✅ Container App module created"

echo ""
echo "✨ All Terraform modules generated successfully!"
echo ""
echo "Next steps:"
echo "  1. cd terraform/"
echo "  2. cp terraform.tfvars.example terraform.tfvars"
echo "  3. Edit terraform.tfvars with your actual values"
echo "  4. terraform init"
echo "  5. terraform plan"
echo "  6. terraform apply"

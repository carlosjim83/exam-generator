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
          secret_name = lookup(env.value, "secret", false) ? lower(replace(env.value.name, "_", "-")) : null
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
      name  = lower(replace(secret.value.name, "_", "-"))
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

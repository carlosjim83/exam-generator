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

  scale {
    type     = each.value.sku.name
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
